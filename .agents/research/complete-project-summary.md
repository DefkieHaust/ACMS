# ACMS - Complete Project Summary

## Project Overview
Apartment Community Management System (ACMS) — full-stack web app for managing apartment complexes with multi-tenant isolation, committee management, billing, visitor tracking, complaints, notices, and more.

## Current Version
- **Git tag:** v1.6.0
- **Main branch:** `main`
- **GitHub:** https://github.com/DefkieHaust/ACMS

## Stack
- **Backend:** Node.js (ESM) + Express 4.x + Mongoose 8.x + MongoDB 7.x
- **Frontend:** React 18.x + Vite 5.x + Tailwind CSS 3.x
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **Validation:** Zod 3.x
- **Payments:** Stripe (simulated fallback)
- **Email:** Nodemailer (skipped when unconfigured)
- **Testing:** Jest + Supertest (233 backend tests)
- **CI:** GitHub Actions (Node 18/20/22 matrix, MongoDB service container)

## What's Been Accomplished

### Phase 1 — Bug Fixes (Initial 10 Issues)
All original 10 bugs from AGENTS.md fixed:
1. Dead routes after `export default` in siteAdmin.js
2. PUT `/users/:id` used `req.body` instead of `req.validatedBody`
3. PUT `/apartment/units/:id` no validation + no tenant isolation
4. GET `/invoices/generate` mutation (changed to POST)
5. 10+ endpoints with no input validation (Zod schemas added)
6. DELETE endpoints crash from missing ObjectId validation (all 12 fixed)
7. Audit middleware missing on complaints, visitors, notices, users, export, uploads
8. Regex search vulnerability (escapeRegex applied everywhere)
9. File upload no tenant isolation (Upload model with apartmentId)
10. AccountManagementPage change-password required currentPassword (admin change-password schema fixed)

### Additional Bug Fixes (15+ found during audit)
- Analytics route mounted at wrong path (was `/api/admin/analytics` → fixed to `/api/analytics`)
- AnalyticsPage used `setData(overview)` instead of `setData(overview.data)` (property access crash)
- Missing `committeeId` in Zod schema for `POST /bills/generate`
- `GET /committees/:id` missing `committeeId` auth check
- `POST /complaints` — inserted wrong path in notification message
- `POST /facilities` didn't enforce `apartmentId` isolation
- `GET /documents` missing `apartmentId` filter for non-admin
- `PUT /notifications/:id/read` missing ownership check
- `GET /notifications/unread-count` missing user filter
- Multiple PUT routes missing `return` after `res.status(404)` (response header race)
- `POST /committees` Zod schema missing `description` field
- `POST /committees/:id/bills/generate` Zod schema `dueDate` missing `transform` to Date
- `PUT /units/:id/resident` not awaiting `unit.save()`
- `POST /upload` — files without `.` in extension produced empty `mimeType`
- `controllers/upload.js` — directories named exactly like their parent file could collide

### Tests Added
- `tests/analytics.test.js` — 4 tests for analytics endpoints
- `tests/notifications.test.js` — 6 tests for notification CRUD + mark-read
- `tests/uploads.test.js` — 4 tests for file upload + download
- `tests/facilities.test.js` — 2 tests for facility CRUD (+ booking tests already existed)

### Features Added
- **Real-time notifications** — WebSocket push (socket.io), replaces 30s polling
- **Email delivery** — User.email field wired into email service, SMTP configurable
- **Design system implementation** — DESIGN.md tokens fully implemented (colors, typography, spacing, component tokens)
- **Dark mode** — Theme toggle with class strategy + localStorage persistence
- **Dark mode on all components** — Applied to every component and page
- **i18n infrastructure** — react-i18next setup (English base, Spanish partial)
- **Docker support** — Dockerfile + docker-compose with healthcheck, init container, .dockerignore
- **CI pipeline** — GitHub Actions matrix (Node 18/20/22) + MongoDB service + frontend build
- **Release workflow** — Auto GitHub Release on `v*` tags

### UI/UX Redesign (v1.6.0)
All 31 pages and components redesigned with premium visual language:

#### Design System
- **Font stack**: DM Sans (body, weights 400/500/600) + DM Serif Display (headings, weight 700) via Google Fonts
- **Color palette**: Primary (indigo), accent (amber/gold), surface colors for light/dark
- **Animations**: 10+ custom keyframes (fade-in-up, slide-in-left, scale-in, shimmer, slide-down, float, pulse-slow, wiggle, border-glow)
- **Utility classes**: `skeleton-shimmer`, `glass-card`, `stat-value`, `page-enter`, `card-hover`, `table-row-hover`

#### Components
- **Button.jsx** — 4 variants (primary, secondary, danger, ghost), 3 sizes, `active:scale-[0.98]` press effect, shadow accents, dark mode, `rounded-xl`
- **Card.jsx** — default/stat/hover variants, `rounded-2xl`, dark mode (`dark:bg-gray-900 dark:border-gray-800`)
- **Badge.jsx** — 17 statuses, colored dot indicators, dark mode, `_` → space display
- **Modal.jsx** — `backdrop-blur-sm` overlay, `animate-scale-in`, dark mode border, close button hover zone, Escape key, focus trap
- **NotificationBell.jsx** — polished dropdown with SVG bell icon, unread count badge, skeleton loading, dark mode

#### Layout
- **Sidebar**: dark bg (`bg-gray-900`), responsive slide-in/out (300ms ease-out), overlay on mobile, nav items with dot indicators and active glow
- **Header**: fixed, glassmorphism (`bg-white/80 backdrop-blur-md`), gradient avatar, user badge, theme toggle, notification bell

#### Login Pages
- Split-screen: dark gradient branding panel (geometric blurs, grid pattern) + clean form panel
- Stats display (apartments, units, committees)
- Animated SVG spinner, proper typography hierarchy, active-scale buttons

#### Dashboards
- **SiteAdminDashboard** — 6 stat cards with colored gradient top-borders, staggered `fade-in-up` animations, skeleton loading, enhanced charts section
- **ApartmentAdminDashboard** — stat cards with gradient borders, skeleton loading, tabbed sections
- **ResidentDashboard** — stat cards (unit, total due, open complaints), bills/notices panels, "no unit" empty state
- **CommitteeHeadDashboard** — adaptive stats (different for head vs member), income/expense/balance cards, ledger + complaints panels

#### All 23 Content Pages
Every table, card, list, and form page redesigned with:
- `rounded-2xl` table/card wrappers
- `tracking-wider` uppercase table headers
- Dark mode throughout (bg, text, borders, hover states)
- Skeleton shimmer loading states (replacing old LoadingSkeleton/PageLoading)
- SVG icon + centered message empty states
- `rounded-xl` error alerts with retry buttons
- Consistent `rounded-xl` inputs with focus rings
- Action buttons with `transition-colors` + dark mode hover
- Badge dark mode variants for all status colors
- Consistent spacing and typography hierarchy

## Key Architecture Decisions
- Multi-tenant isolation via `apartmentId` injected by middleware
- JWT payload: `{ userId, type, apartmentId, committeeId, unitId }`
- Response envelope: `{ success: boolean, data?: ..., error?: string }`
- Pagination: `?page=1&limit=20` on all list endpoints
- Audit logging on all CRUD operations (create/update/delete)
- ESM modules throughout backend

## Todo / Next for v1.7.0
- Multi-language support (i18n already scaffolded, needs full translations)
- Analytics dashboard — advanced charts and reporting
- Further micro-interactions (row reveals, toast animations, form field focus)
- Comprehensive responsive testing across all 31 pages
- Consider WebSocket authentication hardening
- Consider rate limiting on auth endpoints

## Tests
- **Backend tests**: 233 total (Jest + Supertest)
- **Test files**: 12 files covering routes, auth permissions, and edge cases
- **CI**: Runs on push/PR to main, matrix across Node 18/20/22, MongoDB service container

## CI/CD
- `.github/workflows/ci.yml` — unit tests (no DB), route tests (MongoDB service), frontend build
- `.github/workflows/release.yml` — creates GitHub Release automatically on `v*` tag push
