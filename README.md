# ACMS — Apartment Committee Management System

Smart society management platform for apartment complexes, housing societies, and residential communities. Multi-tenant SaaS with role-based dashboards, committee management, billing, complaints, visitor logging, facility booking, and real-time notifications.

## Features

- **Multi-Tenant SaaS** — Isolated apartments sharing a single MongoDB cluster
- **Role-Based Access** — 6 roles: Site Admin, Apartment Admin, Committee Head, Committee Member, Resident, Unit Owner
- **Dashboard per Role** — Tailored KPIs, charts, and quick actions
- **Committee Management** — Create committees (security, maintenance, social), assign heads and members, custom roles
- **Billing & Invoices** — Generate maintenance bills per unit per period, track paid/unpaid/overdue
- **SaaS Plans** — Per-unit or flat-rate pricing, auto-generated monthly invoices for apartment admins
- **Complaint Tracking** — Residents raise complaints, committees assign and resolve with ratings
- **Visitor Log** — Check-in/check-out, pre-approval with QR codes
- **Notice Board** — Post notices per committee or apartment-wide
- **Facility Booking** — Book common areas (gym, pool, hall) with date/time slots
- **Service Requests** — Residents request repairs/services, admins assign and track
- **Document Management** — Upload and organize documents by category
- **Committee Ledger** — Track income/expenses per committee
- **Audit Logging** — All CRUD operations logged with user, action, and timestamp
- **Real-Time Notifications** — WebSocket push for in-app notifications
- **Email Notifications** — Optional SMTP for bill, complaint, and notice alerts
- **Stripe Payments** — Optional payment processing with simulated fallback
- **i18n Support** — English, Spanish, French (extensible)
- **Dark Mode** — Full theme support with persistent toggle
- **File Uploads** — Tenant-isolated file storage with authenticated download
- **REST API** — Full JSON API with pagination, search, validation (Zod), and rate limiting

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, Chart.js, i18next |
| **Backend** | Node.js 20, Express 4, Mongoose 8, JWT |
| **Database** | MongoDB 7 |
| **Validation** | Zod 3 |
| **Real-Time** | WebSocket (ws) |
| **Payments** | Stripe (simulated fallback) |
| **Email** | Nodemailer (skipped when unconfigured) |

## Quick Start (Docker — Recommended)

### Prerequisites

- Docker Engine 24+ and Docker Compose v2
- Git

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/DefkieHaust/ACMS.git
cd ACMS

# 2. Create environment file
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET to a strong random string

# 3. Build and start
make build
make up

# 4. Open in browser
open http://localhost:5000
```

**Default Credentials:**
- **Site Admin** — identifier: `admin`, password: `admin123`
- Login at `http://localhost:5000/admin/login`

The app auto-seeds a site admin account and default plans (Starter $5/unit, Standard $199 flat) on first run.

### Makefile Targets

| Command | Description |
|---|---|
| `make build` | Build Docker image (tagged with git tag or commit hash) |
| `make up` | Start all services (app + MongoDB) |
| `make down` / `make stop` | Stop and remove containers |
| `make rebuild` | Build then up |
| `make publish` | Tag with git tag + latest, push to GHCR |

## Manual Setup (Without Docker)

### Prerequisites

- Node.js 20+
- MongoDB 7+ (local or remote)
- npm

### Steps

```bash
# 1. Clone and enter
git clone https://github.com/DefkieHaust/ACMS.git
cd ACMS

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd frontend && npm install && cd ..

# 4. Configure environment
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET at minimum

# 5. Start MongoDB (if local)
mongod --dbpath /data/db

# 6. Seed database
npm run seed

# 7. Start backend (terminal 1)
npm run dev

# 8. Start frontend (terminal 2)
cd frontend && npm run dev
```

Backend runs on `http://localhost:5000`, frontend on `http://localhost:5173` (proxies `/api` to backend).

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `PORT` | `5000` | No | Backend port |
| `MONGODB_URI` | `mongodb://localhost:27017/acms` | Yes | MongoDB connection string |
| `JWT_SECRET` | — | Yes | Secret for JWT token signing |
| `JWT_EXPIRES_IN` | `7d` | No | Token expiry duration |
| `NODE_ENV` | `development` | No | Runtime environment |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:5000` | No | Allowed CORS origins (production) |
| `SMTP_HOST` | — | No | SMTP server for email |
| `SMTP_PORT` | `587` | No | SMTP port |
| `SMTP_USER` | — | No | SMTP username |
| `SMTP_PASS` | — | No | SMTP password |
| `SMTP_FROM` | `noreply@acms.app` | No | From address |
| `STRIPE_SECRET_KEY` | — | No | Stripe secret key (simulated if unset) |

## Roles & Permissions

| Role | Scope | Capabilities |
|---|---|---|
| **Site Admin** | Global | Manage apartments, plans, SaaS invoices, all accounts, audit logs, analytics |
| **Apartment Admin** | Per-apartment | Manage units, residents, committees, facilities, documents, service requests |
| **Committee Head** | Per-committee | Manage members, ledger, bills, complaints, notices, documents |
| **Committee Member** | Per-committee | View visitor log, handle complaints, view documents |
| **Resident** | Per-unit | View bills, raise complaints, book facilities, service requests, notices |
| **Unit Owner** | Per-unit | Same as resident + ownership data |

## Run Tests

```bash
# Backend (233+ tests, Jest + Supertest)
npm test

# Frontend
cd frontend && npm test
```

## Project Structure

```
src/                     # Backend
├── config/              # App config, DB connection, constants, env validation
├── middleware/           # Auth, validation, audit, rate limiter, logger
├── models/              # 19 Mongoose models
├── routes/              # 17 route files
├── services/            # Email, payment, notification services
├── utils/               # Helpers, Zod schemas
├── index.js             # Express app entry point
├── seed.js              # Auto-seeder
├── cron.js              # Monthly invoice scheduler
└── websocket.js         # WebSocket server

frontend/src/            # Frontend
├── api/                 # Axios client
├── components/          # Reusable UI components (14)
├── contexts/            # Auth context
├── hooks/               # Custom hooks
├── locales/             # i18n translations (EN, ES, FR)
├── pages/               # 31 page components
├── utils/               # Constants
├── App.jsx              # Route definitions
├── i18n.js              # i18next setup
├── index.css            # Tailwind + animations
└── main.jsx             # Entry point

deploy/                  # Self-hosting
├── compose.yml          # Docker Compose (uses GHCR images)
Makefile                 # Build automation
```

## API Overview

All endpoints return `{ success: boolean, data?: ..., error?: string }`. Authenticated via `Authorization: Bearer <token>` header.

### Public

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/apartments` | List active apartments |
| `POST` | `/api/auth/login` | Login (returns JWT) |

### Site Admin (`/api/admin`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/apartments` | List apartments (paginated, searchable) |
| `POST` | `/apartments` | Create apartment |
| `GET` | `/apartments/:id` | Get single apartment |
| `PUT` | `/apartments/:id` | Update apartment |
| `DELETE` | `/apartments/:id` | Delete apartment |
| `GET` | `/plans` | List plans |
| `POST` | `/plans` | Create plan |
| `PUT` | `/plans/:id` | Update plan |
| `DELETE` | `/plans/:id` | Delete plan |
| `GET` | `/accounts` | List all accounts |
| `POST` | `/accounts` | Create account |
| `PUT` | `/accounts/:id` | Update account |
| `DELETE` | `/accounts/:id` | Delete account |
| `PUT` | `/accounts/:id/change-password` | Admin change password |
| `GET` | `/invoices` | List SaaS invoices |
| `PUT` | `/invoices/:id` | Mark invoice paid |

### Apartment Admin (`/api/apartment`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/units` | List units (paginated, searchable) |
| `POST` | `/units` | Create unit |
| `GET` | `/units/:id` | Get single unit |
| `PUT` | `/units/:id` | Update unit |
| `DELETE` | `/units/:id` | Delete unit |
| `GET` | `/residents` | List residents |
| `POST` | `/residents` | Create resident |
| `PUT` | `/residents/:id` | Update resident |
| `DELETE` | `/residents/:id` | Delete resident |
| `GET` | `/committees` | List committees |
| `POST` | `/committees` | Create committee |
| `PUT` | `/committees/:id` | Update committee |
| `DELETE` | `/committees/:id` | Delete committee |
| `POST` | `/committees/:id/head` | Set committee head |
| `GET` | `/settings` | Get apartment settings |
| `PUT` | `/settings` | Update apartment settings |
| `GET` | `/documents` | List documents |
| `POST` | `/documents` | Upload document |
| `DELETE` | `/documents/:id` | Delete document |
| `GET` | `/service-requests` | List service requests |
| `PUT` | `/service-requests/:id` | Update service request |
| `GET` | `/notices` | List notices |
| `POST` | `/notices` | Create notice |

### Committee (`/api/committees`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/:committeeId/members` | List members |
| `POST` | `/:committeeId/members` | Add member |
| `PUT` | `/:committeeId/members/:id` | Update member role |
| `DELETE` | `/:committeeId/members/:id` | Remove member |
| `GET` | `/:committeeId/ledger` | List ledger entries |
| `POST` | `/:committeeId/ledger` | Create ledger entry |
| `DELETE` | `/:committeeId/ledger/:id` | Delete ledger entry |
| `POST` | `/:committeeId/generate-bills` | Generate maintenance bills |
| `GET` | `/:committeeId/roles` | List custom roles |
| `POST` | `/:committeeId/roles` | Create custom role |
| `DELETE` | `/:committeeId/roles/:id` | Delete custom role |

### Other Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/complaints` | List complaints (filterable by status/committee) |
| `POST` | `/api/complaints` | Create complaint |
| `PUT` | `/api/complaints/:id` | Update complaint (status, assignment, rating) |
| `GET` | `/api/visitors` | List visitor logs |
| `POST` | `/api/visitors` | Log visitor |
| `PUT` | `/api/visitors/:id/checkout` | Check out visitor |
| `GET` | `/api/notices` | List notices |
| `POST` | `/api/notices` | Create notice |
| `GET` | `/api/dashboard/:type` | Dashboard stats per role |
| `GET` | `/api/notifications` | List notifications (paginated) |
| `PUT` | `/api/notifications/:id/read` | Mark notification read |
| `GET` | `/api/uploads` | List uploads |
| `POST` | `/api/uploads` | Upload file |
| `GET` | `/api/uploads/:id/download` | Download file |
| `DELETE` | `/api/uploads/:id` | Delete upload |
| `GET` | `/api/users` | List users |
| `PUT` | `/api/users/:id` | Update user |
| `POST` | `/api/change-password` | Change own password |
| `GET` | `/api/export/:resource` | Export data as CSV |
| `GET` | `/api/facilities` | List facilities |
| `POST` | `/api/facilities` | Create facility |
| `PUT` | `/api/facilities/:id` | Update facility |
| `DELETE` | `/api/facilities/:id` | Delete facility |
| `GET` | `/api/facilities/:id/bookings` | List bookings |
| `POST` | `/api/facilities/:id/book` | Book facility |
| `DELETE` | `/api/bookings/:id` | Cancel booking |
| `GET` | `/api/payments` | List payments |
| `POST` | `/api/payments/create-intent` | Create payment intent |
| `GET` | `/api/analytics` | Analytics data |
| `GET` | `/api/audit-logs` | List audit logs |
| `GET` | `/api/health` | Health check |

## i18n

The app supports English, Spanish, and French. Language is detected from `localStorage` or browser settings. Toggle via the language switcher in the sidebar header.

To add a new language, create `frontend/src/locales/{lang}.json` and register it in `frontend/src/i18n.js`.

## License

MIT
