# ACMS Architecture

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                   Browser (SPA)                       │
│              React + Vite + Tailwind                  │
│                        │                              │
│              axios /api proxy (Vite dev)               │
│              OR express.static (production)            │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Express REST API (port 5000)             │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐  │
│  │ Auth MW │ │ Validate │ │ Audit  │ │ RateLimit │  │
│  └─────────┘ └──────────┘ └────────┘ └───────────┘  │
│                        │                              │
│  ┌──────────────────────────────────────────────┐    │
│  │          17 Route Modules                     │    │
│  └──────────────────────────────────────────────┘    │
│                        │                              │
│  ┌──────────────────────────────────────────────┐    │
│  │        19 Mongoose Models (MongoDB 7)         │    │
│  └──────────────────────────────────────────────┘    │
│                        │                              │
│  ┌───────────┐ ┌────────────┐ ┌────────────────┐    │
│  │  Email    │ │  Stripe    │ │  WebSocket     │    │
│  │  Service  │ │  Payments  │ │  Server (/ws)  │    │
│  └───────────┘ └────────────┘ └────────────────┘    │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                MongoDB 7 (Single Cluster)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │  acms    │ │  acms_   │ │  acms_   │  ...         │
│  │  users   │ │  units   │ │  bills   │             │
│  └──────────┘ └──────────┘ └──────────┘             │
└─────────────────────────────────────────────────────┘
```

## Multi-Tenant Architecture

ACMS uses **shared-database, shared-collection** multi-tenancy. All apartment data lives in the same MongoDB collection, isolated by the `apartmentId` field on every document.

### Tenant Isolation Middleware

```js
// src/middleware/auth.js — tenantIsolation()
- Site admin: req.apartmentId = null (global access)
- All other roles: req.apartmentId = req.user.apartmentId
- Every model query filters by req.apartmentId
- Site admin routes bypass apartment filtering
```

### Data Flow

```
User Login
  ↓
JWT issued with { userId, type, apartmentId, committeeId, unitId }
  ↓
Every API request:
  → authenticate() extracts JWT → req.user
  → authorize(...roles) checks req.user.type
  → tenantIsolation() sets req.apartmentId
  → validate(schema) parses & validates req.body → req.validatedBody
  → audit(action, resource) logs to AuditLog on response
  → Route handler queries with req.apartmentId filter
```

## Directory Structure

```
ACMS/
├── src/                          # Backend (Node.js ESM)
│   ├── config/
│   │   ├── index.js              # Env vars, port, JWT config
│   │   ├── db.js                 # MongoDB connect/disconnect
│   │   ├── constants.js          # Role enums, status enums, currencies
│   │   └── validate.js           # Env validation on startup
│   ├── middleware/
│   │   ├── auth.js               # authenticate(), authorize(), tenantIsolation()
│   │   ├── validate.js           # Zod schema validation middleware
│   │   ├── audit.js              # CRUD audit logging
│   │   ├── rateLimiter.js        # Login + API rate limiting
│   │   ├── logger.js             # Request logging (INFO/WARN/ERROR)
│   │   └── responseFormatter.js  # success(), created(), error() helpers
│   ├── models/                   # 19 Mongoose schemas
│   ├── routes/                   # 17 Express routers
│   ├── services/
│   │   ├── email.js              # Nodemailer (optional SMTP)
│   │   ├── payment.js            # Stripe (simulated fallback)
│   │   └── notify.js             # DB notification + WebSocket push + email
│   ├── utils/
│   │   ├── helpers.js            # hashPassword, comparePassword, JWT, escapeRegex
│   │   └── validate.js           # All Zod schemas (186 lines)
│   ├── index.js                  # Express app bootstrap
│   ├── seed.js                   # Auto-seeder (admin + plans)
│   ├── cron.js                   # Monthly SaaS invoice generation
│   └── websocket.js              # WebSocket server (path: /ws)
│
├── frontend/src/                 # Frontend (React + Vite)
│   ├── api/
│   │   └── client.js             # Axios instance, interceptors
│   ├── components/
│   │   ├── Layout.jsx            # Sidebar + header + main content
│   │   ├── Modal.jsx             # Reusable modal (focus trap, escape key)
│   │   ├── ConfirmModal.jsx      # Confirmation dialog
│   │   ├── Button.jsx            # 4 variants × 3 sizes
│   │   ├── Card.jsx              # Default/stat/hover cards
│   │   ├── Badge.jsx             # Status badges (17 variants)
│   │   ├── EmptyState.jsx        # Empty table/card state
│   │   ├── Pagination.jsx        # Page navigation
│   │   ├── PaymentModal.jsx      # Stripe/simulated payment
│   │   ├── LanguageSwitcher.jsx  # EN/ES/FR toggle
│   │   ├── NotificationBell.jsx  # Unread count + dropdown
│   │   └── NotificationBadge.jsx # Dot badge
│   ├── contexts/
│   │   └── AuthContext.jsx       # Login/logout, token persistence
│   ├── pages/                    # 31 page components
│   ├── locales/                  # en.json, es.json, fr.json
│   ├── utils/constants.js        # NAV_ITEMS per role, status enums
│   ├── App.jsx                   # Route definitions
│   ├── i18n.js                   # i18next init
│   ├── index.css                 # Tailwind + custom animations
│   └── main.jsx                  # Entry point
│
├── deploy/
│   └── compose.yml               # Production compose (GHCR images)
├── tests/                        # 12 test files (Jest + Supertest)
├── Makefile                      # Build automation
├── Dockerfile                    # Multi-stage production build
└── .env.example                  # Environment template
```

## Backend Architecture

### Request Lifecycle

```
Request
  ↓
cors() → express.json() → express.static()
  ↓
requestLogger(req, res, next)
  ↓
/api limit → apiLimiter (200 req/15min)
  ↓
Route-specific chain:
  authenticate() → authorize(...) → tenantIsolation()
  → validate(schema) → audit(action, resource) → handler
  ↓
Response { success: true/false, data?, error? }
```

### Middleware Stack

| Middleware | File | Purpose |
|---|---|---|
| `cors` | Express | CORS headers (dynamic origins in production) |
| `express.json` | Express | JSON body parsing |
| `express.static` | Express | Serves frontend SPA in production |
| `requestLogger` | `middleware/logger.js` | Logs method, path, status, duration |
| `apiLimiter` | `middleware/rateLimiter.js` | 200 requests per 15 min on `/api` |
| `authenticate` | `middleware/auth.js` | Verifies JWT from Authorization header |
| `authorize` | `middleware/auth.js` | Checks user role against allowed roles |
| `tenantIsolation` | `middleware/auth.js` | Sets `req.apartmentId` based on JWT |
| `validate` | `middleware/validate.js` | Parses body via Zod, sets `req.validatedBody` |
| `audit` | `middleware/audit.js` | Logs CRUD to AuditLog collection |
| `loginLimiter` | `middleware/rateLimiter.js` | 20 attempts per 15 min on login |

### Models (19 Collections)

| Model | Collection | Key Fields | Tenant-Scoped |
|---|---|---|---|
| `User` | `users` | type, apartmentId, committeeId, unitId, name, identifier, passwordHash, phone[], email | Yes (via type) |
| `Apartment` | `apartments` | name, address, city, country, status, planId | No (global) |
| `Unit` | `units` | apartmentId, unitNumber, unitType, residentUserId, ownerId, status | Yes |
| `Committee` | `committees` | apartmentId, name, description, headUserId, status | Yes |
| `Plan` | `plans` | name, priceType (per-unit/flat), price, billingCycle | No (global) |
| `SaaSInvoice` | `sasainvoices` | apartmentId, planId, period, amount, status | Yes |
| `MaintenanceBill` | `maintenancebills` | apartmentId, committeeId, unitId, amount, period, status, dueDate | Yes |
| `CommitteeLedger` | `committeeledgers` | apartmentId, committeeId, type (income/expense), amount, description | Yes |
| `Complaint` | `complaints` | apartmentId, committeeId, raisedByUnitId, title, description, status, assignedTo, rating | Yes |
| `VisitorLog` | `visitorlogs` | apartmentId, visitorName, purpose, unitVisited, loggedBy, checkIn/Out, qrCode, preApproved | Yes |
| `Notice` | `notices` | apartmentId, committeeId, title, body, postedBy | Yes |
| `Facility` | `facilities` | apartmentId, name, description, capacity, available | Yes |
| `FacilityBooking` | `facilitybookings` | apartmentId, facilityId, unitId, date, startTime, endTime, status | Yes |
| `ServiceRequest` | `servicerequests` | apartmentId, unitId, residentUserId, title, description, category, priority, status | Yes |
| `Document` | `documents` | apartmentId, uploadedBy, originalName, filename, mimeType, size, category | Yes |
| `Upload` | `uploads` | apartmentId, uploadedBy, originalName, storedName, mimeType, size | Yes |
| `Notification` | `notifications` | apartmentId, userId, type, message, link, read | Yes |
| `AuditLog` | `auditlogs` | userId, action, resource, resourceId, details | No (global) |
| `CustomRole` | `customroles` | committeeId, name, createdBy | Yes |

### Route Modules (17)

| Router | File | Prefix | Access |
|---|---|---|---|
| Auth | `routes/auth.js` | `/api/auth` | Public + authenticated |
| Site Admin | `routes/siteAdmin.js` | `/api/admin` | `site_admin` |
| Apartment Admin | `routes/apartmentAdmin.js` | `/api/apartment` | `apartment_admin`, `site_admin` |
| Committee | `routes/committee.js` | `/api/committees` | Role-dependent sub-routes |
| Complaints | `routes/complaints.js` | `/api/complaints` | Resident, committee_head, committee_member |
| Visitor Logs | `routes/visitorLogs.js` | `/api/visitors` | Committee member, head |
| Notices | `routes/notices.js` | `/api/notices` | Multiple roles |
| Dashboard | `routes/dashboards.js` | `/api/dashboard` | All roles |
| Users | `routes/users.js` | `/api/users` | Authenticated |
| Export | `routes/export.js` | `/api/export` | Apartment admin |
| Uploads | `routes/uploads.js` | `/api/uploads` | Multiple roles |
| Facilities | `routes/facilities.js` | `/api/facilities` | Multiple roles |
| Notifications | `routes/notifications.js` | `/api/notifications` | All roles |
| Documents | `routes/documents.js` | `/api/documents` | All roles |
| Service Requests | `routes/serviceRequests.js` | `/api/service-requests` | Resident, apartment_admin |
| Payments | `routes/payments.js` | `/api/payments` | Resident |
| Analytics | `routes/analytics.js` | `/api/analytics` | Site admin, apartment admin |

### Services

#### Email (`services/email.js`)
- Nodemailer with configurable SMTP
- Skipped entirely when `SMTP_HOST` is unset (logs to console)
- Template functions: `notifyNewBill`, `notifyComplaintUpdate`, `notifyNewNotice`

#### Payment (`services/payment.js`)
- Stripe integration with simulated fallback
- `createPaymentIntent(amount, currency, metadata)` — auto-falls back to simulated
- `confirmPayment(paymentIntentId)` — retrieves intent status

#### Notification (`services/notify.js`)
- Creates DB documents in `notifications` collection
- Pushes real-time via WebSocket (`notifyUser`)
- Sends email when SMTP configured
- Functions: `notifyUsers`, `notifyApartmentAdmins`, `notifyCommitteeMembers`, `notifyResident`

### WebSocket

- Path: `/ws`
- Auth via message: `{ type: 'auth', userId: '...' }`
- `notifyUser(userId, payload)` sends directly to connected client
- Auto-cleanup on disconnect

### JWT Payload

```json
{
  "userId": "ObjectId",
  "type": "site_admin|apartment_admin|committee_head|committee_member|resident|unit_owner",
  "apartmentId": "ObjectId|null",
  "committeeId": "ObjectId|null",
  "unitId": "ObjectId|null",
  "iat": "timestamp",
  "exp": "timestamp"
}
```

## Frontend Architecture

### Component Tree

```
<BrowserRouter>
  <AuthProvider>                          # Manages login state, token in localStorage
    <Toaster />                            # Global toast notifications
    <Routes>
      <Login /> / <AdminLogin />           # Public pages (no Layout)
      <Layout>                             # Sidebar + header + content
        <Sidebar />                        # Role-based NAV_ITEMS
        <Header>
          <LanguageSwitcher />             # EN/ES/FR toggle
          <NotificationBell />             # WS + polling unread count
          <ThemeToggle />                  # Dark mode switch
        </Header>
        <PageContent>                      # Route-specific page component
          <Modal />                        # View/Edit/Create modals
          <ConfirmModal />                 # Delete confirmations
          <PaymentModal />                 # Payment UI
          <EmptyState />                   # When no data
          <Pagination />                   # Page navigation
        </PageContent>
      </Layout>
      <NotFound />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

### Page Routing

Routes are defined in `App.jsx` with lazy loading (`React.lazy` + `Suspense`).

| Guard | Purpose |
|---|---|
| `ProtectedRoute` | Any authenticated non-site-admin → wraps in Layout |
| `AdminProtectedRoute` | Only site_admin → wraps in Layout |
| `AnyAuthRoute` | Any authenticated user → wraps in Layout |
| `RoleRoute` | Checks user type against allowed roles |

### State Management

- **No external store** (no Redux, Zustand, etc.)
- Auth state via `AuthContext` (token + user object)
- Page state via `useState` + `useEffect` (fetch on mount)
- Form state via local `useState`
- Toast via `react-hot-toast` (context-free)

### API Client (`api/client.js`)

- Axios instance with `baseURL: '/api'`
- Request interceptor: attaches JWT from localStorage
- Response interceptor: unwraps `{ success, data }` envelope, auto-redirects on 401
- Development: Vite dev server proxies `/api` → `http://localhost:5000`
- Production: served by Express `express.static` on same origin

### Design System

See [DESIGN.md](./DESIGN.md) for full tokens.

| Component | Variants | File |
|---|---|---|
| `Button` | primary, secondary, danger, ghost; sm/md/lg | `components/Button.jsx` |
| `Card` | default, stat, hover | `components/Card.jsx` |
| `Badge` | 17 status + color combinations | `components/Badge.jsx` |
| `Modal` | Focus trap, Esc to close | `components/Modal.jsx` |
| `ConfirmModal` | Confirm/cancel with danger variant | `components/ConfirmModal.jsx` |

CSS animations: `fade-in-stagger`, `input-focus-ring`, `table-row-enter`, `btn-pulse`, `pulseRing`, `toastSlideIn/Out`, `scaleCheck`.

### i18n Architecture

```
i18n.js
  ├── en.json (213 keys)
  ├── es.json (213 keys)
  └── fr.json (213 keys)

Usage:
  import { useTranslation } from 'react-i18next';
  const { t } = useTranslation();
  t('nav.dashboard')           → "Dashboard"
  t('role.site_admin')          → "Site Admin"
  t('common.save')              → "Save"
```

Detection: localStorage → navigator language. Fallback: English.

### Dark Mode

- Tailwind `class` strategy
- Toggle stored in `localStorage('theme')`
- Applied via class on `<html>` element
- All pages and components have `dark:` variants

## Validation Architecture

### Backend (Zod)

All mutation endpoints use Zod schemas defined in `src/utils/validate.js`. The `validate()` middleware:

1. Parses `req.body` against the schema
2. On failure: returns `400 { success: false, error: 'Validation failed', details: [...] }`
3. On success: sets `req.validatedBody` with cleaned data

Key schemas: `loginSchema`, `createUserSchema`, `updateUserSchema`, `changePasswordSchema`, `createUnitSchema`, `createApartmentSchema`, `createCommitteeSchema`, `generateBillsSchema`, `createComplaintSchema`, `createVisitorLogSchema`, `createNoticeSchema`, `updateUnitSchema`, `updateAccountSchema`.

### Frontend

- No Zod on frontend (backend is the single source of truth)
- Form validation via `required` attribute and API error display
- `toast.error(err.response?.data?.error)` shows server validation errors

## Authentication & Authorization

### Login Flow

```
POST /api/auth/login { identifier, password, type, apartmentName? }
  → loginLimiter (20 req/15min)
  → validate(loginSchema)
  → Find user by type + identifier (+ apartmentName for non-admin)
  → comparePassword(password, hash)
  → generateToken({ userId, type, apartmentId, committeeId, unitId })
  → Return { token, user: { id, name, type, ... } }
```

### Role Hierarchy

For operations that manage subordinate roles, the hierarchy is:

```
site_admin → apartment_admin, committee_head, committee_member, resident, unit_owner
apartment_admin → resident, unit_owner
committee_head → resident, unit_owner
committee_member → resident, unit_owner
```

### Password Change Rules

- `site_admin`, `committee_head`, `committee_member`: can change password without current password
- All other roles: must provide current password

## Key Design Decisions

1. **Single container serves API + frontend** — The production Docker image bundles both the Express API and the compiled SPA (`express.static`). No nginx, no separate frontend container.

2. **No ORM** — Mongoose is used directly with schema definitions. No additional abstraction layer.

3. **Response envelope** — Every response is `{ success: boolean, data?, error?, details? }`. Frontend client unwraps `data` from the envelope in the Axios response interceptor.

4. **Pagination** — All list endpoints accept `?page=1&limit=20` and return `{ success, data, pagination: { total, page, limit, totalPages } }`.

5. **Audit logging** — Middleware intercepts `res.json()` to capture the response. All create/update/delete operations are logged with user, action, resource, resourceId, and sanitized request body.

6. **WebSocket notifications** — Single `/ws` path. Clients authenticate by sending `{ type: 'auth', userId }`. Unread notification count is also polled via REST for reliability.

7. **Simulated payments** — When `STRIPE_SECRET_KEY` is unset, `createPaymentIntent` returns `{ id: 'simulated_...', status: 'succeeded', simulated: true }`. This allows full workflow testing without Stripe.

8. **Graceful email degradation** — When `SMTP_HOST` is unset, email functions log to console and return `{ skipped: true }`. The notification service creates DB notifications and WebSocket pushes regardless.

9. **Multi-tenant via `apartmentId`** — Every data model (except global ones like Plan, AuditLog) includes an `apartmentId` field. All queries filter by `req.apartmentId` set by the `tenantIsolation()` middleware.

10. **Auto-seed** — On first startup, the app checks for a site_admin. If none exists, creates `admin/admin123` and two default plans (Starter, Standard).

## Scheduled Tasks

| Task | Schedule | File | Description |
|---|---|---|---|
| SaaS Invoice Generation | 1st of each month at midnight | `src/cron.js` | Creates invoices for active apartments with plans |
| Auto-Seed | On startup (once) | `src/seed.js` | Creates admin + plans if empty |

## Testing

### Backend (Jest + Supertest)

```
tests/
├── db.js                      # In-memory MongoDB (mongodb-memory-server)
├── setup.js                   # Global test setup
├── helpers.test.js            # Helper function tests
├── validate.test.js           # Zod schema tests
├── e2e.test.js                # End-to-end API tests
├── middleware/                 # Middleware unit tests
├── routes/                    # Route integration tests
```

- Uses `mongodb-memory-server` for isolated database
- 233+ tests covering all routes and validators
- Run: `npm test`

### Frontend (Vitest)

```
frontend/src/test/
├── setup.js                   # Test setup (jsdom)
├── components.test.jsx        # Component tests
```

- Run: `cd frontend && npm test`

## Deployment

### Docker Build Process

```
Multi-stage Dockerfile:
  Stage 1 (frontend-build): npm ci → vite build
  Stage 2 (production): npm ci --omit=dev → copy src + dist → run
```

### Makefile Targets

```
make build    → docker build -t ghcr.io/defkiehaust/acms:<tag>
make up       → docker compose -f deploy/compose.yml up -d
make down     → docker compose -f deploy/compose.yml down
make rebuild  → build + up
make publish  → tag with git tag + latest, push to GHCR
```

### Tagging Convention

- **Build tag**: git tag (if HEAD is exactly tagged), otherwise commit short hash
- **Publish tags**: `{git-tag}` + `latest`

### Environment Variables (Production)

Set via `.env` file or environment in Docker:

```
JWT_SECRET=<random-64-char-string>
MONGODB_URI=mongodb://mongo:27017/acms
NODE_ENV=production
```

## Dependencies

### Backend (`package.json`)

**Production**: bcryptjs, cors, dotenv, express, express-rate-limit, jsonwebtoken, mongoose, multer, node-cron, nodemailer, qrcode, stripe, ws, zod

**Dev**: eslint, jest, mongodb-memory-server, nodemon, supertest

### Frontend (`frontend/package.json`)

**Production**: axios, chart.js, i18next, i18next-browser-languagedetector, react, react-chartjs-2, react-dom, react-hot-toast, react-i18next, react-router-dom, tailwindcss-animate

**Dev**: @tailwindcss/forms, @vitejs/plugin-react, autoprefixer, eslint, jsdom, postcss, tailwindcss, vite, vitest
