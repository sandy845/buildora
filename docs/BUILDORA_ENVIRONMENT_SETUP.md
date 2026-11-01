# BUILDORA — PRODUCTION ENVIRONMENT & RELIABILITY SPECIFICATION

**Project:** Buildora  
**Document Version:** 1.0.0  
**Target Environment:** Vercel Serverless + PostgreSQL + Cloudflare R2 / S3 + Upstash Redis  
**Security Classification:** Confidential / Internal Engineering Reference  

---

## 1. Executive Overview

This specification documents the complete environment variable schema, connection management, failure modes, and production configuration for Buildora.

Buildora operates on a zero-trust, fail-closed security architecture:
1. **Authoritative State:** PostgreSQL (Prisma 6) is the sole authoritative store for all application domain data (users, projects, quotations, approvals, documents, blueprints, messages, payments).
2. **Stateless Session Authentication:** HMAC-SHA256 signed `buildora_session` cookies with instant revocation tracking via Redis.
3. **Decoupled Binary Storage:** S3-compatible presigned uploads/downloads directly between client browser and storage (Cloudflare R2 / AWS S3) keeping application servers free from binary I/O.
4. **Resilient Degradation:** In non-production or during external service outages, non-critical services (email, storage presigning, Redis) degrade to safe local fallbacks without crashing the application.

---

## 2. Environment Variables Inventory

| Variable Name | Environment | Required | Default / Fallback | Purpose & Security Constraints |
|---|---|---|---|---|
| `DATABASE_URL` | All | **Required** | None | PostgreSQL connection URI (`postgresql://...`). In production on Vercel, must use connection pooler (e.g., PgBouncer / Supabase pooler / Neon pooler) with `?pgbouncer=true`. |
| `AUTH_SECRET` | Production | **Required** | In dev: 32-char test key | Cryptographic secret for signing `buildora_session` cookies with HMAC-SHA256. Minimum 32 random characters. |
| `NEXT_PUBLIC_APP_URL` | All | Optional | `http://localhost:3000` | Canonical public URL (e.g. `https://buildora-gray.vercel.app`). Used for CSRF origin validation, email link generation, and mock storage endpoints. |
| `BUILDORA_ADMIN_EMAILS` | All | Optional | `""` | Comma-separated list of lowercased emails authorized for administrator role assignment during OAuth/registration. |
| `STORAGE_REGION` | Production | **Required** | None | S3 / R2 storage region (e.g. `auto` for Cloudflare R2, `ap-south-1` for AWS Mumbai). |
| `STORAGE_BUCKET` | Production | **Required** | None | Name of the private object storage bucket (e.g. `buildora-production-assets`). |
| `STORAGE_ACCESS_KEY` | Production | **Required** | None | IAM access key ID with read/write access limited to the designated bucket. |
| `STORAGE_SECRET_KEY` | Production | **Required** | None | IAM secret access key. Must never be exposed to the browser. |
| `STORAGE_ENDPOINT` | Production | Optional | AWS S3 Default | Custom S3 endpoint URL (e.g. `https://<account-id>.r2.cloudflarestorage.com` for Cloudflare R2). |
| `ALLOW_DEV_STORAGE_MOCK` | Development | Optional | `"0"` | Set to `"1"` only in development to allow mock presigned uploads when real storage is unconfigured. Strictly rejected in production. |
| `UPSTASH_REDIS_REST_URL` | Production | Recommended | In-memory | Upstash Redis REST endpoint (`https://...upstash.io`). Powers multi-region distributed rate-limiting and cross-instance session revocation. |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Recommended | In-memory | Upstash Redis REST bearer authentication token. |
| `RESEND_API_KEY` | Production | Recommended | Simulated | API token for Resend transactional email delivery (`re_...`). |
| `EMAIL_FROM` | All | Optional | `Buildora <no-reply@buildora.in>` | Validated sender email address used in transactional notifications. |
| `EMAIL_ADMIN` | All | Optional | `admin@buildora.in` | Administrative inbox for new lead notifications and critical alerts. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | All | Optional | None | Client-side Firebase Web SDK API key for Google OAuth popup. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | All | Optional | None | Firebase authentication domain (e.g. `buildora-prod.firebaseapp.com`). |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | All | Optional | None | Firebase project ID. |
| `FIREBASE_PROJECT_ID` | Production | Optional | None | Firebase Admin SDK project ID. |
| `FIREBASE_CLIENT_EMAIL` | Production | Optional | None | Firebase Admin service account client email. |
| `FIREBASE_PRIVATE_KEY` | Production | Optional | None | Firebase Admin service account private key (`-----BEGIN PRIVATE KEY...`). |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Production | Optional | None | Full service account JSON string (alternative to individual keys). |

---

## 3. Database Connection Pooling for Vercel

In serverless execution environments like Vercel, each serverless function invocation may spawn in an isolated Node process. Direct connections to PostgreSQL can rapidly exhaust server connection limits under concurrent traffic.

### Recommended Configuration
1. **Connection Pooling Endpoint:**
   Use a pooled connection string with `pgbouncer=true` and `connection_limit=5`:
   ```bash
   DATABASE_URL="postgresql://user:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5"
   ```
2. **Global Client Reuse:**
   `src/lib/db/prisma.ts` binds `prismaClient` to `globalThis.buildoraPrisma`. Across warm serverless function invocations within the same container, the connection pool is preserved, preventing connection churn.
3. **Database Timeout Safety:**
   All domain database operations are wrapped in `safeDatabaseOperation()` (`src/lib/services/shared.ts`). If a connection times out or the database restarts, queries fail closed with `ServiceError("DATABASE_ERROR")` and never leak internal connection strings or stack traces.

---

## 4. Object Storage Setup (Cloudflare R2 / AWS S3)

### Bucket Configuration
1. **Bucket Privacy:** Set the bucket access policy to **Private**. Public read access must be disabled.
2. **CORS Configuration:** The storage bucket requires a CORS policy to allow direct browser `PUT` uploads:
   ```json
   [
     {
       "AllowedOrigins": [
         "https://buildora-gray.vercel.app",
         "http://localhost:3000"
       ],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
3. **Key Isolation & Naming:**
   Keys are generated by `buildObjectKey()` in `src/lib/storage.ts` using the strict convention:
   ```text
   projects/${projectId}/${subfolder}/${sanitizedFileName}-${timestamp}.${ext}
   ```
   Cross-project key access is rejected at both URL presigning and record confirmation.

---

## 5. Distributed Rate Limiting & Session Revocation

Buildora utilizes Upstash Redis via its REST API (`src/lib/rate-limit.ts` and `src/lib/auth/revocation.ts`):
1. **Sliding-Window Rate Limiting:**
   - Atomic Redis pipelines (`INCR` + `EXPIRE`) enforce rate limits across serverless instances.
   - If Redis is unconfigured or unreachable, the system gracefully falls back to an in-memory sliding-window store without throwing or interrupting user requests.
2. **Instant Token Revocation:**
   - User logout or password reset immediately writes revocation markers (`revoked_token:${sessionId}` and `revoked_user:${userId}`) to Redis with TTL matching the session lifetime.
   - Valid sessions become unusable within milliseconds across all regional edge instances.

---

## 6. Verification & Health Monitoring

The deployment health endpoint is available at `/api/health`.

### Health Check Response Format
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "database": "connected",
  "storage": "cloudflare-r2",
  "email": "resend",
  "redis": "configured"
}
```

If the database is unreachable, the endpoint returns HTTP 503 with `"database": "disconnected"`.

