# CivicFix — REST API Specification

All endpoints are mounted under `/api`. All government-scoped endpoints authenticate the request via `Authorization: Bearer <token>` or simulated `x-user-id` session header.

## Endpoints

### 1. Authentication
- `POST /api/auth/login`: Authenticate via email & password. Returns JWT token and User profile.
- `POST /api/auth/register`: Create a new citizen account.
- `GET /api/auth/me`: Retrieve current user profile.
- `POST /api/auth/switch-role`: Instant persona switcher for demo and testing.

### 2. Civic Issues
- `GET /api/issues`: Query issues with filters (`status`, `priority`, `category`, `departmentId`, `search`, `page`, `pageSize`).
- `GET /api/issues/:id`: Retrieve single issue with images, comments, assignments, and audit history.
- `POST /api/issues`: Submit a new civic issue report. Automatically assigns SLA deadline.
- `POST /api/issues/:id/status`: Transition issue status with mandatory audit note.
- `POST /api/issues/:id/assign`: Dispatch or reassign a field officer.
- `POST /api/issues/:id/escalate`: Escalate issue to Supervisor, Manager, or Admin.
- `POST /api/issues/:id/verify`: Citizen inspection confirmation (`verified: true/false`).
- `POST /api/issues/:id/upvote`: Toggle citizen support / endorsement.
- `GET /api/issues/:id/comments`: Fetch public comments and internal government notes.
- `POST /api/issues/:id/comments`: Post comment (supports `isInternal: true` for staff).
- `POST /api/issues/:id/upload-image`: Attach BEFORE, AFTER, or EVIDENCE work photo.

### 3. AI Services
- `POST /api/ai/analyze-image`: Multimodal vision classification using Gemini 3.8 Flash.
- `POST /api/ai/assist-description`: Generates professional complaint title and description from brief citizen prompts.
- `POST /api/ai/duplicate-check`: Geospatial distance and category duplicate verification.
- `POST /api/ai/officer-assist`: Generates field investigation procedures and citizen status update drafts.

### 4. SLA & Analytics
- `GET /api/sla/policies`: Retrieve SLA response and resolution targets.
- `GET /api/sla/metrics`: Real-time compliance rate and average turnaround time.
- `POST /api/sla/check`: Trigger manual audit loop.
- `GET /api/analytics/dashboard`: Cross-department KPI summary and trends.
- `GET /api/analytics/export`: Download CSV export of all issues.

### 5. Administration & Audit
- `GET /api/users`: List users and roles.
- `POST /api/users`: Create staff or citizen accounts.
- `GET /api/departments`: List departments.
- `GET /api/audit-logs`: Query immutable regulatory audit log trail.
- `GET /api/health`: Platform status and worker uptime.
