import assert from "node:assert/strict";
import test from "node:test";
import { validateEnv, getEnvSummary } from "../src/lib/env.ts";

test("Environment: validateEnv passes with valid complete configuration", () => {
  const validMockEnv = {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://buildora:secret_pass@localhost:5432/buildora?schema=public",
    AUTH_SECRET: "abcdef1234567890abcdef1234567890", // 32 chars
    NEXT_PUBLIC_APP_URL: "https://buildora-gray.vercel.app",
    STORAGE_REGION: "ap-south-1",
    STORAGE_BUCKET: "buildora-bucket",
    STORAGE_ACCESS_KEY: "access-key-123",
    STORAGE_SECRET_KEY: "secret-key-456",
  };

  const parsed = validateEnv(validMockEnv);
  assert.equal(parsed.NODE_ENV, "production");
  assert.equal(parsed.DATABASE_URL, validMockEnv.DATABASE_URL);
  assert.equal(parsed.AUTH_SECRET, validMockEnv.AUTH_SECRET);
});

test("Environment: validateEnv in production throws on missing DATABASE_URL", () => {
  const invalidEnv = {
    NODE_ENV: "production",
    AUTH_SECRET: "abcdef1234567890abcdef1234567890",
  };

  assert.throws(
    () => {
      validateEnv(invalidEnv);
    },
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes("DATABASE_URL"));
      return true;
    }
  );
});

test("Environment: validateEnv in production throws on short or missing AUTH_SECRET", () => {
  const shortSecretEnv = {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://localhost:5432/db",
    AUTH_SECRET: "too-short",
  };

  assert.throws(
    () => {
      validateEnv(shortSecretEnv);
    },
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes("AUTH_SECRET"));
      return true;
    }
  );
});

test("Environment: getEnvSummary returns accurate non-sensitive diagnostic snapshot", () => {
  const testEnv = {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://user:pass@host:5432/db",
    AUTH_SECRET: "abcdef1234567890abcdef1234567890",
    RESEND_API_KEY: "re_test_key_12345",
    UPSTASH_REDIS_REST_URL: "https://my-redis.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "redis_secret_token",
    STORAGE_REGION: "ap-south-1",
    STORAGE_BUCKET: "my-bucket",
    STORAGE_ACCESS_KEY: "key",
    STORAGE_SECRET_KEY: "secret",
  };

  const summary = getEnvSummary(testEnv);
  assert.equal(summary.environment, "production");
  assert.equal(summary.database, "configured");
  assert.equal(summary.authSecret, "configured");
  assert.equal(summary.storage, "configured");
  assert.equal(summary.redis, "configured");
  assert.equal(summary.email, "resend");

  // Ensure NO secrets appear in summary
  const serialized = JSON.stringify(summary);
  assert.ok(!serialized.includes("re_test_key_12345"));
  assert.ok(!serialized.includes("redis_secret_token"));
  assert.ok(!serialized.includes("secret_pass"));
});

test("Environment: getEnvSummary correctly identifies unconfigured optional services", () => {
  const minimalEnv = {
    NODE_ENV: "development",
  };

  const summary = getEnvSummary(minimalEnv);
  assert.equal(summary.environment, "development");
  assert.equal(summary.database, "unconfigured");
  assert.equal(summary.authSecret, "using_dev_default");
  assert.equal(summary.storage, "unconfigured");
  assert.equal(summary.redis, "in_memory");
  assert.equal(summary.email, "simulated");
  assert.equal(summary.firebaseAuth, "unconfigured");
  assert.equal(summary.firebaseAdmin, "unconfigured");
});

