import { z } from "zod";

// ==============================================================================
// Environment Variable Schema Definitions
// ==============================================================================

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // 1. Authoritative Database (PostgreSQL via Prisma)
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required.")
    .refine(
      (url) => url.startsWith("postgres://") || url.startsWith("postgresql://"),
      "DATABASE_URL must be a valid PostgreSQL connection string."
    ),

  // 2. Authentication Secret (HMAC-SHA256 session signature key)
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long.")
    .optional(),

  // Admin email whitelist (comma-separated)
  BUILDORA_ADMIN_EMAILS: z.string().default(""),

  // 3. Application Public URL
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL.")
    .default("http://localhost:3000"),

  // 4. Object Storage (Cloudflare R2 / AWS S3)
  STORAGE_REGION: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_ENDPOINT: z.string().url().optional(),
  ALLOW_DEV_STORAGE_MOCK: z.string().optional(),

  // 5. Distributed Rate Limiting & Session Revocation (Upstash Redis)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // 6. Transactional Email (Resend / Postmark / SMTP)
  RESEND_API_KEY: z.string().optional(),
  POSTMARK_SERVER_TOKEN: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("Buildora <no-reply@buildora.in>"),
  EMAIL_ADMIN: z.string().default("admin@buildora.in"),

  // 7. Optional Firebase (Client OAuth & Admin Token Verification)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof EnvSchema>;

export type EnvironmentSummary = {
  environment: "development" | "test" | "production";
  database: "configured" | "unconfigured";
  authSecret: "configured" | "using_dev_default" | "missing";
  storage: "configured" | "dev_mock" | "unconfigured";
  redis: "configured" | "in_memory";
  email: "resend" | "postmark" | "smtp" | "simulated";
  firebaseAuth: "configured" | "unconfigured";
  firebaseAdmin: "configured" | "unconfigured";
};

/**
 * Validates process.env at application boot time.
 * In production: throws a descriptive error if critical configuration is missing or invalid.
 * In development / test: logs warnings for missing optional services while preserving local DX.
 */
export function validateEnv(env: Record<string, string | undefined> = process.env): ValidatedEnv {
  const isProduction = env.NODE_ENV === "production";
  const result = EnvSchema.safeParse(env);

  if (!result.success) {
    const issues = result.error.issues || [];
    const errorDetails = issues
      .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
      .join("\n");

    const message = `[buildora/env] Invalid or missing environment configuration:\n${errorDetails}`;

    if (isProduction) {
      // In production, halt early to prevent running with insecure or missing credentials
      throw new Error(message);
    } else {
      console.warn(message);
    }
  }

  // Ensure AUTH_SECRET is explicitly provided in production
  if (isProduction && (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32)) {
    throw new Error(
      "[buildora/env] In production, AUTH_SECRET must be explicitly set and be at least 32 characters long."
    );
  }

  return (result.success ? result.data : (env as unknown)) as ValidatedEnv;
}

/**
 * Returns a sanitized diagnostic summary of active integrations
 * WITHOUT logging or exposing any private credentials.
 */
export function getEnvSummary(env: Record<string, string | undefined> = process.env): EnvironmentSummary {
  const isProduction = env.NODE_ENV === "production";

  const isDbConfigured = Boolean(
    env.DATABASE_URL &&
      (env.DATABASE_URL.startsWith("postgres://") || env.DATABASE_URL.startsWith("postgresql://"))
  );

  let authSecretStatus: "configured" | "using_dev_default" | "missing" = "missing";
  if (env.AUTH_SECRET && env.AUTH_SECRET.length >= 32) {
    authSecretStatus = "configured";
  } else if (!isProduction) {
    authSecretStatus = "using_dev_default";
  }

  let storageStatus: "configured" | "dev_mock" | "unconfigured" = "unconfigured";
  if (env.STORAGE_REGION && env.STORAGE_BUCKET && env.STORAGE_ACCESS_KEY && env.STORAGE_SECRET_KEY) {
    storageStatus = "configured";
  } else if (!isProduction && env.ALLOW_DEV_STORAGE_MOCK === "1") {
    storageStatus = "dev_mock";
  }

  const redisStatus = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
    ? "configured"
    : "in_memory";

  let emailProvider: "resend" | "postmark" | "smtp" | "simulated" = "simulated";
  if (env.RESEND_API_KEY) {
    emailProvider = "resend";
  } else if (env.POSTMARK_SERVER_TOKEN) {
    emailProvider = "postmark";
  } else if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    emailProvider = "smtp";
  }

  const firebaseAuthStatus = Boolean(
    env.NEXT_PUBLIC_FIREBASE_API_KEY && env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )
    ? "configured"
    : "unconfigured";

  const firebaseAdminStatus = Boolean(
    env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY)
  )
    ? "configured"
    : "unconfigured";

  return {
    environment: (env.NODE_ENV as "development" | "test" | "production") || "development",
    database: isDbConfigured ? "configured" : "unconfigured",
    authSecret: authSecretStatus,
    storage: storageStatus,
    redis: redisStatus,
    email: emailProvider,
    firebaseAuth: firebaseAuthStatus,
    firebaseAdmin: firebaseAdminStatus,
  };
}
