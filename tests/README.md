# Buildora Test Strategy & Test Suite

This repository includes unit tests, domain service tests, action tests, and automated Playwright end-to-end smoke tests.

## Test Commands

```bash
# Run unit & action tests (Node 24 native test runner)
npm test

# Run automated browser smoke tests (Playwright)
npm run test:e2e

# Run type validation across the whole codebase
npm run typecheck
```

## Test Coverage Layers

1. **Authentication**:
   - Registration validation, password hashing/verification, invalid credentials, session expiry, logout, and role redirection.
   - Brute-force rate limiting: sliding window limiters on `/auth/login` (10/15m) and `/auth/register` (5/1h) returning HTTP 429.

2. **Lead Capture & Notifications**:
   - Form validation, required field checks, service connection.
   - Lead creation with automated customer confirmation email and admin notification email dispatch.

3. **Storage & Assets (AWS S3 / Cloudflare R2)**:
   - SigV4 HMAC-SHA256 presigned PUT and GET URL generation.
   - MIME validation and size limits (25MB documents, 50MB CAD blueprints).
   - Direct-to-bucket upload with database confirmation and timeline activity logging.
   - Dev mock upload fallback for local testing without cloud credentials.

4. **Production Health Check**:
   - `/api/health` providing real-time database latency (ms), storage status, email provider, rate limiter backend, and process memory stats.

5. **Playwright E2E Smoke Tests (`tests/e2e/`)**:
   - `health.smoke.spec.ts`: Validates `/api/health` returns HTTP 200 with service diagnostics.
   - `login.smoke.spec.ts`: Validates login page elements, client validation on empty form, and invalid credential rejection.
   - `lead-capture.smoke.spec.ts`: Validates `/contact` lead enquiry form rendering, field validation, submission, and confirmation UI.
   - `dashboard.smoke.spec.ts`: Validates client and admin dashboard KPIs, workspace tabs, and blueprint/document upload modal controls.
