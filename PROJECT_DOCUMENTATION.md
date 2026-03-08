# Placement Portal - Complete Project Documentation

## 1. Project Overview

### 1.1 Purpose
The Placement Portal is a full-stack web application for managing campus placement and internship workflows at JIMS Rohini Sector-5.

It supports four operational personas:
- Student
- Recruiter/Company
- TPO (mapped from `hod` role alias)
- Admin

### 1.2 Core Functional Areas
- Authentication (register, login, profile identity, forgot/reset password)
- Job posting and job lifecycle management
- Student applications and status progression
- Student profile/resume data management
- AI-assisted resume parsing and interview question generation
- Role-based dashboards, activities, analytics, and quick actions

---

## 2. Repository Structure

```text
Placement-Portal/
  placement-portal-backend/   # Node.js + Express + MySQL API
  placement-portal-frontend/  # React + TypeScript + Vite UI
```

### 2.1 Backend Important Paths
- `src/server.js` - app bootstrap and route mounting
- `src/routes/` - route modules
- `src/controllers/` - controller modules (auth)
- `src/services/` - service modules (auth business logic)
- `src/middleware/` - auth/error/async middleware
- `src/utils/` - shared helpers (`AppError`, company job scope resolver)
- `scripts/init-db.sql` - base schema
- `scripts/migrate-add-job-created-by.sql` - adds `jobs.created_by`
- `scripts/migrate-add-reset-password-columns.sql` - adds reset token columns

### 2.2 Frontend Important Paths
- `src/App.tsx` - route composition
- `src/context/AuthContext.tsx` - auth/session context
- `src/api/` - API client wrappers
- `src/components/layout/PortalLayout.tsx` - shared sidebar/topbar layout
- `src/components/dashboard/` - reusable dashboard widgets
- `src/pages/` - page modules by role/domain

---

## 3. Tech Stack

### 3.1 Backend
- Node.js (ES modules)
- Express
- MySQL (`mysql2/promise`)
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Email (`nodemailer`)
- File upload (`multer`)
- PDF parsing (`pdf-parse`)
- OpenAI SDK (`openai`)

### 3.2 Frontend
- React 19 + TypeScript
- React Router
- Vite
- Recharts (charts)
- Framer Motion (animations)
- Lucide React (icons)

---

## 4. Role Model and Authorization

### 4.1 Roles in DB
`users.role` supports:
- `student`
- `admin`
- `recruiter`
- `hod`

### 4.2 Runtime Role Normalization (backend middleware)
- `recruiter` -> `company`
- `hod` -> `tpo`

This means route checks often use `company` and `tpo` even though DB stores `recruiter`/`hod`.

### 4.3 Access Control Pattern
Backend routes use:
- `authenticateToken` (JWT verification)
- `authorizeRoles(...roles)`

Protected frontend pages are wrapped via `ProtectedRoute` and `PortalLayout`.

---

## 5. Backend Architecture and Flow

## 5.1 Layering
The backend follows a route -> controller -> service pattern for auth and route-level handlers for other modules.

- Route layer: Express endpoint mapping
- Controller layer: request/response orchestration (auth)
- Service layer: business logic + DB + crypto/email logic (auth)
- Middleware: cross-cutting concerns (auth, async wrapper, errors)

## 5.2 Request Lifecycle
1. Request enters `server.js`
2. Route-level middleware validates auth/role
3. Controller/handler executes business logic
4. DB operations via pooled MySQL connection
5. Errors are normalized by `errorHandler`

## 5.3 Error Response Shape
Typical error response:

```json
{
  "success": false,
  "error": {
    "code": "SOME_CODE",
    "message": "Human-readable message"
  }
}
```

In non-production, stack traces are included.

---

## 6. Environment Configuration

## 6.1 Backend (`placement-portal-backend/.env`)
Required/optional variables used in code:

- `PORT` (default: `3000`)
- `JWT_SECRET` (fallback exists but should be strong and explicit)
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `OPENAI_API_KEY` (required for AI routes)
- `FRONTEND_URL` (used for reset-password link generation)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM` (optional, defaults to SMTP user)

Existing `.env.example` currently includes base DB/JWT/port values and should be extended for SMTP/OpenAI in production.

## 6.2 Frontend
Current API base is hardcoded in `src/api/client.ts`:
- `http://localhost:3000/api`

For production, move to Vite env (`import.meta.env`) with environment-based base URL.

---

## 7. Database Design

## 7.1 `users`
Columns:
- `id` (PK)
- `email` (unique)
- `password_hash`
- `role` enum (`student`, `admin`, `recruiter`, `hod`)
- `name`
- `reset_password_token` (nullable)
- `reset_password_expire` (nullable)
- `created_at`

## 7.2 `jobs`
Columns:
- `id` (PK)
- `title`
- `company`
- `created_by` (nullable FK to `users.id`)
- `ctc`
- `location`
- `description`
- `requirements`
- `status` enum (`open`, `closed`)
- `created_at`

### Ownership Fallback Logic
Because some deployments may not yet have an ownership FK column, backend utility `buildCompanyJobScope` resolves scope as:
1. Use first existing owner column among: `company_id`, `recruiter_id`, `user_id`, `created_by`
2. If none exist, fallback to company-name match:
   `LOWER(TRIM(jobs.company)) = LOWER(TRIM(company_user_name))`

## 7.3 `applications`
Columns:
- `id` (PK)
- `job_id` (FK to jobs)
- `student_id` (FK to users)
- `status` enum (`applied`, `eligible`, `shortlisted`, `test_scheduled`, `interview_scheduled`, `selected`, `rejected`)
- `applied_at`
- unique constraint on (`job_id`, `student_id`)

## 7.4 `student_profiles`
Columns for academic, skill, social profile, and AI resume JSON:
- `student_id` (PK/FK to users)
- percentages/backlogs/grad year
- skills/frameworks/tools/certifications
- `projects_json`
- internship/achievements
- GitHub/LinkedIn/portfolio URLs
- `ai_resume_json`
- `created_at`, `updated_at`

---

## 8. Database Setup and Migration

## 8.1 Initial Setup
Run:
- `scripts/init-db.sql`

## 8.2 Incremental Migrations
Run as needed:
- `scripts/migrate-add-job-created-by.sql`
- `scripts/migrate-add-reset-password-columns.sql`

Note: if schema drift exists in older environments, the job ownership fallback allows operations to continue without immediate hard failure.

---

## 9. Backend API Reference

Base URL: `http://localhost:3000/api`

Authentication header for protected routes:
`Authorization: Bearer <token>`

## 9.1 Auth
- `POST /auth/register`
  - body: `{ email, password, role, name? }`
  - returns token + user

- `POST /auth/login`
  - body: `{ email, password }`
  - returns token + user

- `GET /auth/me` (auth required)
  - returns current user profile

- `POST /auth/forgot-password`
  - body: `{ email }`
  - creates secure reset token (hashed in DB, 1h expiry), sends email

- `POST /auth/reset-password/:token`
  - body: `{ password }`
  - validates token, updates password hash, clears reset fields

## 9.2 Jobs
- `GET /jobs` (student/company/tpo/admin)
  - company sees only its scoped jobs

- `GET /jobs/:id` (optional auth)
  - company access restricted to its own scoped jobs

- `POST /jobs` (admin/company)
  - create new job posting

- `PUT /jobs/:id` (admin/company)
  - update job details/status

- `DELETE /jobs/:id` (admin/company)
  - remove job

## 9.3 Applications
- `POST /applications` (student)
  - apply to job

- `GET /applications/my` (student)
  - student’s own applications

- `GET /applications?jobId=...` (admin/company/tpo)
  - list applicant records; company-scoped

- `PATCH /applications/:id/status` (admin/company/tpo)
  - update application status

## 9.4 Users
- `GET /users?role=&q=` (admin/tpo)
  - user directory filtering/search

## 9.5 Student Profile
- `GET /profile/me` (student)
- `PUT /profile/me` (student)

## 9.6 Student Resume Parse
- `POST /student/parse-resume` (student)
  - multipart form with `resume` PDF
  - extracts structured data via AI

## 9.7 AI Utilities
- `POST /ai/generate-resume` (student/company/tpo/admin)
- `POST /ai/generate-questions` (student/company/tpo/admin)

## 9.8 Health
- `GET /health`

---

## 10. Security Details

- Passwords are hashed using bcrypt before storing.
- JWT tokens are required for protected API access.
- Forgot-password uses:
  - random raw token (32-byte hex)
  - SHA-256 hashed token in DB
  - expiry enforcement (1 hour)
  - token invalidation after successful reset/expiry
- Auth middleware enforces role checks and alias normalization.

Security note: avoid relying on fallback JWT secret in production; always set a strong `JWT_SECRET`.

---

## 11. Frontend Architecture

## 11.1 Routing
Public routes include:
- `/`
- `/about`
- `/recruitment-process`
- `/placement-statistics`
- `/contact`
- `/role-selection`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password/:token`

Protected routes are grouped under `PortalLayout` and role checks.

## 11.2 Session Management
`AuthContext` stores:
- user payload in `localStorage` key: `placement_user`
- JWT in `localStorage` key: `placement_token`

On login, route redirects by role:
- student -> `/student/dashboard`
- recruiter -> `/company/dashboard`
- admin/hod -> `/admin/dashboard`

## 11.3 Shared Layout
`PortalLayout` provides:
- role-aware sidebar menu
- topbar greeting + profile dropdown
- logout action in sidebar footer

## 11.4 API Layer
`src/api/client.ts` centralizes fetch logic and error extraction.
Domain APIs:
- `auth.ts`
- `jobs.ts`
- `applications.ts`
- `profile.ts`
- `users.ts`
- `ai.ts`
- `resume.ts`

---

## 12. Dashboard System

Reusable components under `src/components/dashboard`:
- `DashboardLayout`
- `MetricCard`
- `ChartCard`
- `ActivityTimeline`
- `SuggestionPanel`
- `QuickActionCard`
- `DashboardCharts` (Recharts renderers)

Role-specific dashboard homes:
- Student: `pages/student/StudentDashboardHome.tsx`
- Company: `pages/company/CompanyDashboardHome.tsx`
- TPO: `pages/tpo/TpoDashboardHome.tsx`
- Admin: `pages/admin/AdminDashboardHome.tsx`

Features:
- KPI cards with trends
- responsive charts (donut/line/bar)
- activity timeline
- recommendations panel
- quick actions
- student profile strength/readiness visualization

---

## 13. Forgot Password End-to-End Flow

1. User opens `/forgot-password`
2. Submits email
3. Backend validates user existence
4. Generates reset token + hashed storage + expiry
5. Sends email with link:
   `<FRONTEND_URL>/reset-password/<rawToken>`
6. User opens reset link, submits new password
7. Backend hashes submitted password with bcrypt, updates user, clears token fields

Frontend pages:
- `pages/auth/ForgotPasswordPage.tsx`
- `pages/auth/ResetPasswordPage.tsx`

---

## 14. Build, Run, and Development Workflow

## 14.1 Backend
```bash
cd placement-portal-backend
npm install
npm run dev
```

## 14.2 Frontend
```bash
cd placement-portal-frontend
npm install
npm run dev
```

Default local URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## 14.3 Useful Validation Commands
Backend syntax check:
```bash
node --check src/server.js
```

Frontend TypeScript check:
```bash
./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
```

---

## 15. Known Constraints and Recommendations

### 15.1 Current Constraints
- CORS origin is hardcoded to `http://localhost:5173` in backend.
- Frontend API base is hardcoded in `src/api/client.ts`.
- No centralized automated test suite currently configured in scripts.
- Some legacy role naming differences (`recruiter`/`hod` vs `company`/`tpo`) require normalization.

### 15.2 Recommended Improvements
- Add `.env.example` expansion for SMTP/OpenAI/frontend URL.
- Move frontend API base to Vite env (`VITE_API_BASE_URL`).
- Add automated tests:
  - backend integration tests (supertest)
  - frontend component/API tests
- Tighten registration role policy (currently accepts submitted role directly).
- Add structured logging and request IDs.
- Add rate limiting for auth and forgot-password endpoints.

---

## 16. Troubleshooting Guide

## 16.1 `Cannot reach placement API`
- Ensure backend is running on `localhost:3000`
- Verify CORS origin and frontend URL

## 16.2 Forgot Password Email Not Sending
- Verify SMTP vars (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, etc.)
- Check if mail provider requires app passwords or secure port

## 16.3 Company Dashboard Ownership Errors
- If ownership column missing, backend now falls back to company name matching.
- Still recommended to run `migrate-add-job-created-by.sql` for stronger integrity.

## 16.4 AI Routes Return `AI_NOT_CONFIGURED`
- Set `OPENAI_API_KEY` in backend environment.

---

## 17. Deployment Readiness Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure all DB credentials
- [ ] Configure SMTP credentials
- [ ] Configure `OPENAI_API_KEY`
- [ ] Set `FRONTEND_URL` to deployed frontend
- [ ] Configure CORS for deployed frontend origin
- [ ] Run SQL init/migrations in target DB
- [ ] Add HTTPS termination and secure headers
- [ ] Run TS/syntax checks and smoke tests

---

## 18. Quick Start (One-Page Summary)

1. Start MySQL and create DB with `scripts/init-db.sql`
2. Configure backend `.env`
3. Run backend: `npm run dev`
4. Run frontend: `npm run dev`
5. Register users by role and test flows:
   - login
   - job posting
   - student apply
   - status updates
   - forgot/reset password

---

## 19. Document Ownership

This document is intended as the single source of truth for:
- onboarding new developers
- understanding architecture and role flows
- API/database reference
- deployment and troubleshooting

Update this file whenever schema, endpoint contracts, or major workflows change.
