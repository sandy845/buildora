# Buildora

Buildora is a Next.js customer and project portal. PostgreSQL, accessed through Prisma, is the authoritative store for application users and business data. Firebase is optional and used only for Firebase Authentication sign-in.

## Local setup

1. Install Node.js 22 or newer and PostgreSQL 16 or newer.
2. Create a dedicated local PostgreSQL database, then copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to that database and replace `AUTH_SECRET` with a random value of at least 32 characters.
4. Apply the checked-in migrations and generate the Prisma client:

   ```powershell
   npm ci
   npm run db:deploy
   npm run prisma:generate
   ```

5. Start the app:

   ```powershell
   npm run dev
   ```

Firebase variables are needed only if Firebase Authentication is enabled. Configure email delivery and S3-compatible storage before enabling those production features.

## Validation

```powershell
npm run typecheck
npm test
npm run lint
npm run build
```

The Playwright end-to-end suite seeds test users and a sample project. Set `E2E_DATABASE_URL` to a **dedicated disposable test database** before running it; it must not point to production or a database with valuable data:

```powershell
$env:E2E_DATABASE_URL = "postgresql://buildora:password@localhost:5432/buildora_e2e?schema=public"
$env:DATABASE_URL = $env:E2E_DATABASE_URL
npx prisma migrate deploy
npm run test:e2e
```

The browser suite provisions fixed test accounts and project fixtures in that database. Reset that database after testing if you want to remove them.

## Production deployment

- Configure `DATABASE_URL`, a strong `AUTH_SECRET`, email delivery, and private object storage in the hosting provider’s secret manager.
- Apply database migrations during deployment with `npm run db:deploy`; do not use `prisma db push` against production.
- For a new database, review the migrations and apply them to a disposable staging database first.
- Set `BUILDORA_ADMIN_EMAILS` only to exact, operator-controlled email addresses for Firebase-authenticated admin enrollment.
- Configure Firebase client/Admin credentials only if Firebase Authentication is in use.
- Check `/api/health` after deployment. It reports database connectivity and whether storage, email, and session-secret configuration are available.
- Verify customer-to-customer isolation, admin workflows, upload/download permissions, password verification, and account recovery in staging before production traffic.

The GitHub Actions workflow uses an ephemeral PostgreSQL service for validation and browser tests; it does not require production database credentials.
