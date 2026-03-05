# Degxifi KYE Backend

TypeScript + Express + Prisma backend for the Staff KYE (Know Your Employee) system.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **ORM:** Prisma (SQLite, easily switchable to PostgreSQL)
- **Auth:** JWT + bcryptjs
- **File Uploads:** Multer

## Setup

```bash
cd backend
npm install
npm run setup    # generates Prisma client, runs migrations, seeds database
npm run dev      # starts dev server on http://localhost:3000
```

## Default Login Credentials

| Role  | Email                   | Password  | KYE Status         |
|-------|-------------------------|-----------|---------------------|
| Admin | admin@degxifi.com       | admin123  | N/A                 |
| Staff | n.eze@degxifi.com       | staff123  | verified            |
| Staff | c.okafor@degxifi.com    | staff123  | rejected            |
| Staff | a.nnadi@degxifi.com     | staff123  | pending_review      |
| Staff | i.musa@degxifi.com      | staff123  | pending_submission  |

## API Endpoints

### Auth
- `POST /api/auth/login` — Login (body: `{ email, password, role }`)
- `GET  /api/auth/me` — Get current user (requires Bearer token)

### Staff (requires auth)
- `GET  /api/staff/profile` — Get staff profile
- `GET  /api/staff/dashboard` — Get full dashboard data
- `GET  /api/staff/notifications` — Get notifications
- `PUT  /api/staff/notifications/:id/read` — Mark notification read
- `PUT  /api/staff/notifications/read-all` — Mark all notifications read
- `GET  /api/staff/activities` — Get activity timeline

### KYE Submission (requires auth)
- `GET  /api/kye/status` — Get KYE status
- `POST /api/kye/submit` — Submit personal details (body: `{ fullName, phone, dob, address }`)
- `POST /api/kye/upload/:docType` — Upload document (multipart form, docType: `id`, `address`, `selfie`)
- `POST /api/kye/finalize` — Submit KYE for review

### Admin (requires auth + admin role)
- `GET    /api/admin/staff` — List all staff (query: `?search=&status=`)
- `GET    /api/admin/staff/:staffId` — Get staff detail
- `POST   /api/admin/staff` — Invite new staff (body: `{ name, email, department, role }`)
- `DELETE  /api/admin/staff/:staffId` — Remove staff
- `PUT    /api/admin/staff/:staffId/approve` — Approve KYE
- `PUT    /api/admin/staff/:staffId/reject` — Reject KYE (body: `{ reason, comment }`)
- `PUT    /api/admin/staff/:staffId/reopen` — Reopen rejected KYE
- `GET    /api/admin/audit-logs` — Get audit logs (query: `?search=&action=&date=`)
- `DELETE  /api/admin/audit-logs` — Clear all logs
- `GET    /api/admin/download-csv` — Export staff CSV

## Environment Variables

See `.env` file:
- `DATABASE_URL` — Prisma database URL
- `JWT_SECRET` — JWT signing secret (change in production!)
- `PORT` — Server port (default: 3000)
- `CORS_ORIGIN` — CORS origin (default: *)
- `UPLOAD_DIR` — File upload directory
