# Build Instructions: Apartment Committee Management System (ACMS) — Multi-Tenant SaaS

## Role
You are the coding agent responsible for building ACMS end-to-end: a multi-tenant SaaS web platform that apartment/housing societies use to manage residents, committees (departments), billing, complaints, visitor logs, and notices. Follow this spec as the source of truth. Ask before deviating from any architectural decision below.

---

## 1. Tech Stack (fixed)

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS — single dynamic web app, no native mobile app |
| Backend | Node.js + Express (REST API) |
| Database | MongoDB (single shared cluster/database, multi-tenant via `apartmentId` field) |
| Auth | JWT, role-based access control (RBAC) |
| Containerization | Docker, Docker Compose (multi-stage builds) |
| CI/CD | GitHub Actions — lint, test, build, Trivy image scan, deploy |
| Hosting | Cloud VM or container host (AWS/DigitalOcean) |
| Monitoring (stretch) | Prometheus + Grafana |

No native mobile app. The web frontend must be fully responsive and dynamic (SPA behavior, live-updating views for dashboards, complaint status, billing status — via polling or websockets, agent's choice) so it works well on both desktop and mobile browsers.

---

## 2. Tenancy Model

- **Single shared MongoDB database.** Every tenant-scoped document (users, units, committees, bills, complaints, visitor logs, notices) carries an `apartmentId` field.
- All queries and API middleware MUST filter by `apartmentId` from the authenticated user's session — no cross-tenant data access, ever. Build this as a mandatory middleware layer, not an opt-in filter per route.
- The platform (site admin) layer sits above all tenants and has no `apartmentId` scoping — it manages the list of tenants themselves.

---

## 3. User Hierarchy & Roles

| Role | Scope | Created by | Key permissions |
|---|---|---|---|
| **Site Admin** | Platform-wide (no apartmentId) | Seeded/bootstrap only | Create/manage apartments, create the initial Apartment Committee Admin per apartment, view/manage SaaS billing & plans per apartment |
| **Apartment Committee Admin** | One apartment | Site Admin | Manage residents/units, create Committees (departments), create Committee Head accounts, view apartment-wide reports, view (not edit) SaaS invoice from platform |
| **Committee Head** | One committee within one apartment | Apartment Committee Admin | Manage own committee's members, own committee's billing/expense tracking, resolve complaints routed to that committee |
| **Committee Member** | One committee within one apartment | Committee Head | Log visitor entries, update assigned complaint/ticket status, limited to their committee's scope |
| **Resident** | One unit within one apartment | Apartment Committee Admin (or bulk import) | View dues/payment status, raise complaints, view notices |

Notes:
- "Committee" = department (e.g., Maintenance Committee, Mosque Committee, Security Committee). Each apartment can have multiple committees, each fully separate in membership and billing/tracking.
- Committee Head is a **distinct login type** from Committee Member — do not merge these into one type with a role flag. They authenticate differently (see login schema) and should have separate account records for clarity of audit trail, even though both belong to a committee.

---

## 4. Authentication & Login Schema

Login form fields (all logins go through one unified login screen):

1. **Apartment name** — required for all types except Site Admin (Site Admin login skips/hides this field)
2. **Type** — one of: `site_admin`, `apartment_admin`, `committee_head`, `committee_member`, `resident`
3. **Name/ID** — contextual identifier:
   - Resident → unit/apartment number (e.g., "B-204")
   - Apartment Admin / Committee Head / Committee Member → assigned username or staff ID
   - Site Admin → global username
4. **Password**

Backend resolves the account by compound lookup: `{ apartmentId (resolved from apartment name), type, identifier }` except for `site_admin`, which is looked up globally by identifier alone. Passwords hashed with bcrypt. Issue JWT containing `userId`, `type`, `apartmentId` (null for site admin), `committeeId` (where applicable).

---

## 5. Core Data Model (MongoDB collections)

```
apartments
  _id, name, address, status (active/suspended), planId, createdAt

plans
  _id, name, priceType (per-unit/flat), price, billingCycle (monthly), features[]

users
  _id, apartmentId (null for site_admin), type (site_admin|apartment_admin|committee_head|committee_member|resident),
  committeeId (null unless committee_head/committee_member), unitId (null unless resident),
  name, identifier (login "name" field), passwordHash, createdAt, status

units
  _id, apartmentId, unitNumber, residentUserId, status

committees
  _id, apartmentId, name (e.g. "Maintenance Committee"), headUserId, createdAt, status

committee_ledger  (each committee's own billing/expense tracking)
  _id, apartmentId, committeeId, type (income/expense), amount, description, date, recordedBy

maintenance_bills  (resident-facing dues, generated per committee or apartment-wide)
  _id, apartmentId, committeeId, unitId, amount, period, status (paid/unpaid/overdue), dueDate

saas_invoices  (platform billing to apartment)
  _id, apartmentId, planId, period, amount (auto-calculated from plan), status (paid/unpaid), generatedAt, dueDate

complaints
  _id, apartmentId, committeeId, raisedByUnitId, description, status (open/in_progress/resolved), assignedTo, createdAt, resolvedAt, rating

visitor_logs
  _id, apartmentId, visitorName, purpose, unitVisited, loggedBy (committee_member/staff userId), checkIn, checkOut

notices
  _id, apartmentId, committeeId (null if apartment-wide), title, body, postedBy, createdAt
```

---

## 6. SaaS Billing (Site Admin ↔ Apartment)

- Site Admin defines **plans** (e.g., pricing per unit/month, or flat monthly fee).
- On assigning/updating a plan for an apartment, the system auto-generates a `saas_invoices` record every billing cycle (monthly), calculated from the plan's price and the apartment's active unit count if per-unit pricing.
- No payment gateway integration in this phase — invoices are tracked as paid/unpaid manually by Site Admin (mark-as-paid action).
- Apartment Committee Admin has read-only visibility into their apartment's SaaS invoice history.
- Build a scheduled job (cron or CI-triggered task, agent's choice — e.g., `node-cron` in-app or a scheduled GitHub Action hitting an internal endpoint) that generates the next cycle's invoice automatically.

## 7. Committee-Level Billing (separate from SaaS billing)

- Each Committee maintains its own `committee_ledger` — independent income/expense tracking (e.g., Mosque Committee donations vs. Maintenance Committee repair costs).
- `maintenance_bills` can be generated per committee (e.g., Maintenance Committee bills residents monthly) — Committee Head controls generation and rates for their own committee.
- Apartment Committee Admin can view a consolidated report across all committees in their apartment, but does not directly edit each committee's ledger.

---

## 8. Feature Modules

- **Resident & Unit Management** — Apartment Admin manages units/residents.
- **Committee Management** — Apartment Admin creates committees + Committee Head accounts; Committee Head manages their own members.
- **Billing** — two independent tracks: SaaS billing (Site Admin → Apartment) and Committee billing (Committee → Residents / internal ledger).
- **Complaints/Tickets** — resident raises → routed to relevant committee → Committee Head/Member updates status → resident rates resolution.
- **Visitor & Gate Log** — Committee Members (e.g., Security Committee) log visitor/delivery entries.
- **Notices** — apartment-wide (by Apartment Admin) or committee-specific (by Committee Head).
- **Dashboards** — Site Admin: apartments + SaaS revenue overview. Apartment Admin: apartment-wide occupancy, dues, committee summary. Committee Head: own committee's ledger, complaints, members.

---

## 9. Explicit Changes From Prior Draft (apply these)

1. ❌ Remove any native mobile app plan. ✅ Web frontend must be fully dynamic/responsive (SPA behavior, live status updates) to serve as the only client.
2. ✅ Add Site Admin tier: creates/manages apartments and Apartment Committee Admin accounts; tracks and auto-generates monthly SaaS usage invoices per apartment from a pricing plan.
3. ✅ Add Committee (department) structure under each apartment: Apartment Committee Admin creates committees and their Committee Head accounts; each committee manages its own membership, billing, and complaint routing independently.
4. ✅ Committee Head is a separate login type from Committee Member (distinct account records, not a role flag).
5. ✅ Unified login requires: apartment name (skip for site admin), type, name/ID, password.
6. ✅ Replace PostgreSQL with MongoDB (single shared DB, `apartmentId`-scoped documents) throughout backend, ORM/queries, and CI/CD test fixtures.

---

## 10. Non-Functional Requirements

- Strict tenant isolation middleware (reject any query missing/mismatching `apartmentId` for non-site-admin roles).
- Passwords hashed (bcrypt), JWT expiry + refresh flow.
- Input validation on all API routes (e.g., `zod` or `joi`).
- Dockerfiles: multi-stage builds for frontend and backend, minimal final images.
- GitHub Actions pipeline: lint → unit tests → build images → Trivy scan (fail build on high/critical CVEs) → deploy.
- Seed script to bootstrap the first Site Admin account on fresh deployment.

---

## 11. Suggested Build Order

1. MongoDB schema + seed script (incl. bootstrap Site Admin)
2. Auth service (unified login, JWT, RBAC middleware, tenant-isolation middleware)
3. Site Admin module (apartments, plans, SaaS invoices, apartment admin creation)
4. Apartment Admin module (units/residents, committee + committee head creation)
5. Committee module (Committee Head/Member management, committee ledger, maintenance bills)
6. Complaints, Visitor Log, Notices modules
7. Dashboards (Site Admin / Apartment Admin / Committee Head views)
8. Dockerize + docker-compose for local dev
9. GitHub Actions CI/CD (lint/test/build/scan/deploy)
10. End-to-end testing across all five role types before handoff

