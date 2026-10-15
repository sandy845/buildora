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

- Configure `DATABASE_URL`, a strong `AUTH_SECRET`, and Firebase client/Admin credentials when using Firebase email/password or Google authentication.
- Firebase Authentication sends email verification and password-reset links when configured. Configure a transactional email provider (Resend, Postmark, or SMTP) separately if you need Buildora enquiry and project-notification emails.
- Configure private object storage before enabling production document or blueprint uploads.
- Apply database migrations during deployment with `npm run db:deploy`; do not use `prisma db push` against production.
- For a new database, review the migrations and apply them to a disposable staging database first.
- Set `BUILDORA_ADMIN_EMAILS` only to exact, operator-controlled email addresses for Firebase-authenticated admin enrollment.
- Configure Firebase client/Admin credentials only if Firebase Authentication is in use.
- Check `/api/health` after deployment. Its overall status reflects database connectivity and the session secret; storage and transactional email are reported separately because they are optional features.
- Verify customer-to-customer isolation, admin workflows, upload/download permissions, password verification, and account recovery in staging before production traffic.

The GitHub Actions workflow uses an ephemeral PostgreSQL service for validation and browser tests; it does not require production database credentials.

### Deploying with Vercel

1. Import the `sandy845/buildora` GitHub repository into Vercel. The repository root is the Next.js application root; leave **Root Directory** at `./`.
2. Keep Vercel’s detected Next.js framework settings, install command (`npm ci`), and build command (`npm run build`). Do not configure a custom output directory.
3. Add environment variables under **Settings → Environment Variables**. Set at least:
   - `DATABASE_URL`: the production PostgreSQL connection string.
   - `AUTH_SECRET`: a unique random secret of at least 32 characters.
   - `NEXT_PUBLIC_APP_URL`: the production site’s HTTPS origin, including any custom domain.
   - Firebase client and Admin credentials if email/password or Google sign-in is enabled. Firebase Authentication sends account verification and password-reset links.
   - `EMAIL_FROM` and `EMAIL_ADMIN`, plus one email provider configuration (`RESEND_API_KEY`, `POSTMARK_SERVER_TOKEN`, or the `SMTP_*` variables) if Buildora enquiry and project-notification emails are needed.
   - `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, and `STORAGE_SECRET_KEY` before enabling production file uploads. Add `STORAGE_ENDPOINT` for S3-compatible providers such as Cloudflare R2.
4. Add environment variables separately for **Production**, **Preview**, and **Development** as needed. Give Preview a separate non-production database; do not let preview deployments run against production data.
5. Apply reviewed database migrations from a trusted environment with the production `DATABASE_URL` by running `npm run db:deploy`. Do not add this command to Vercel’s build command: preview builds must not migrate the production database, and production migrations should be deliberately reviewed and applied.
6. If Firebase Authentication is enabled, also configure the `NEXT_PUBLIC_FIREBASE_*` client variables and Firebase Admin credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`, or `FIREBASE_SERVICE_ACCOUNT_KEY`). Add the deployed domain to Firebase Authentication’s authorized domains.
7. After deployment, open `/api/health` on the deployed site and confirm the database is reachable. Its storage and transactional-email fields show whether those optional features are configured.

Keep all secret values in Vercel’s environment-variable settings; never commit them to the repository. The build does not need production database credentials to compile, but the deployed app needs `DATABASE_URL` and `AUTH_SECRET` at runtime.
