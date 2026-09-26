# CivicFix — Security, Privacy & Compliance

CivicFix is designed to meet municipal government data compliance standards.

## Security Controls

1. **Authentication & Authorization**:
   - Industry-standard bcrypt password hashing.
   - JWT tokens with configurable expiration and refresh cycles.
   - Enforced RBAC checking at all API routers.
   - Separation of public citizen comments from internal municipal operational notes.

2. **Data Privacy**:
   - Citizens' exact phone numbers and personal emails are masked from public listings.
   - Location coordinates are restricted to problem defect pins, not personal residential tracking.

3. **Auditability & Traceability**:
   - Every status change, assignment change, priority override, and user login creates an immutable record in `audit_logs` storing the actor ID, action name, resource ID, timestamp, and metadata diff.

4. **Input Sanitization & Upload Safety**:
   - File uploads are validated for MIME type (`image/jpeg`, `image/png`, `image/webp`) and size limits (<10MB).
   - Structured JSON validation via Zod (frontend) and Pydantic (backend).
