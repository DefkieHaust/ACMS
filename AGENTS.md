# ACMS - Agent Instructions

## Project Management Workflow

### Versioning Scheme
- **v1.0.x** — Bug fixes / hotfixes (patch)
- **v1.x.0** — Backward-compatible feature additions (minor)
- **v2.0.0** — Breaking changes / major redesign (major)

### Role Definitions (Agent Team)
- **Project Manager** — Oversees all work, prioritizes, delegates, reviews, reports
- **Backend Engineer** — Node.js/Express/MongoDB, API routes, models, middleware, validation, tests
- **Frontend Developer** — React/Vite, pages, components, API integration, state management
- **UI/UX Designer** — Design system, component library, responsive layouts, accessibility
- **QA Tester** — Browser testing, API testing, regression, bug reporting

### Commit Convention
```
<type>(<scope>): <description>

Types: feat, fix, refactor, style, docs, test, chore, perf
Scopes: api, ui, model, auth, billing, payments, visitors, complaints, notices, ledger, bills, units, residents, committees, dashboard, settings, export, upload, cron, seed, tests, config, deps

Examples:
  feat(visitors): add pre-approval QR code flow
  fix(api): validate ObjectId format on all :id params
  refactor(ui): replace confirm() with Modal component
  test(api): add permission boundary tests
```

### Branch Strategy
- `main` — Production-ready, protected
- `v1.x.x` — Release branches
- Feature work done by sub-agents on their own branches or direct to main for single-agent sessions

### Workflow Process
1. PM creates todo list with priorities
2. PM launches parallel sub-agents for independent work
3. Sub-agents complete work, report back
4. PM reviews, runs lint/typecheck/tests
5. PM commits with conventional commit message
6. PM writes checkpoint report after each minor version

## Project Architecture Notes

### Current Stack
- **Backend:** Node.js (ESM) + Express 4.x + Mongoose 8.x + MongoDB 7.x
- **Frontend:** React 18.x + Vite 5.x + Tailwind CSS 3.x
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **Validation:** Zod 3.x
- **Payments:** Stripe (simulated fallback)
- **Email:** Nodemailer (skipped when unconfigured)

### Directory Structure
```
src/                     # Backend
├── config/              # index.js, db.js, constants.js
├── middleware/          # auth.js, validate.js, rateLimiter.js, audit.js, responseFormatter.js
├── models/              # Mongoose models (14 files)
├── routes/              # Express routes (11 files)
├── services/            # payment.js, email.js
├── utils/               # helpers.js, validate.js
├── index.js             # App entry point
├── seed.js              # Auto-seeder
└── cron.js              # Monthly invoice generator

frontend/src/             # Frontend
├── api/client.js        # Axios instance
├── components/          # Modal.jsx, Layout.jsx
├── contexts/AuthContext.jsx
├── pages/               # 21 page components
├── utils/constants.js
├── App.jsx              # Route definitions
└── main.jsx

tests/                   # Jest + Supertest tests (12 files)
```

### Roles
1. `site_admin` — SaaS platform owner, full access
2. `apartment_admin` — Manages a single apartment
3. `committee_head` — Leads a committee
4. `committee_member` — Committee member
5. `resident` — Lives in a unit

### Key Design Decisions
- Multi-tenant isolation via `apartmentId` middleware
- JWT payload: `{ userId, type, apartmentId, committeeId, unitId }`
- Response envelope: `{ success: boolean, data?: ..., error?: string }`
- All list endpoints should support pagination: `?page=1&limit=20`
- Audit logging for all CRUD operations (create/update/delete)

## Known Issues / Tech Debt

### Critical (fix in Phase 1)
1. `/admin/accounts` routes defined AFTER `export default` in siteAdmin.js — DEAD CODE
2. PUT `/users/:id` imports validation schema but uses `req.body` instead of `req.validatedBody`
3. PUT `/apartment/units/:id` no validation + no tenant isolation on body
4. GET `/invoices/generate` is a mutation using GET verb

### High Priority
5. 10+ endpoints have NO input validation
6. DELETE endpoints don't validate ObjectId — crashes with CastError
7. Audit middleware not applied to complaints, visitors, notices, users, export, uploads
8. Regex search vulnerability on 5+ endpoints
9. File upload no tenant isolation
10. AccountManagementPage change-user-password requires current password (admins can't set it)

### Design System Status
- DESIGN.md created with full design tokens
- Need to convert existing components to use design system
- Missing: loading skeleton component, empty state component, confirm dialog modal, pagination component, notification badge component
- Missing: @tailwindcss/forms plugin

## Design System Reference
See [DESIGN.md](./DESIGN.md) for:
- Color palette and semantic colors
- Typography scale and font stack
- Spacing system
- Component design tokens (buttons, cards, tables, badges, forms, modals, sidebar)
- Layout specification
- Responsive breakpoints
- Animation tokens
- Empty state requirements
- Accessibility requirements
