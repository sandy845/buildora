import assert from "node:assert/strict";
import test from "node:test";
import {
  RateLimiter,
  getRateLimitHeaders,
  authPasswordResetLimiter,
  storagePresignLimiter,
  clientMessageLimiter,
} from "../src/lib/rate-limit.ts";
import { apiInternalError } from "../src/lib/api/response.ts";

test("RateLimiter: authPasswordResetLimiter throttles after 5 attempts", () => {
  assert.equal(authPasswordResetLimiter.limit, 5);
  const limiter = new RateLimiter({ limit: 5, windowMs: 15 * 60_000 });
  const ip = `test-pwd-${Date.now()}`;

  for (let i = 0; i < 5; i++) {
    const res = limiter.check(ip);
    assert.equal(res.success, true);
    assert.equal(res.remaining, 4 - i);
  }

  // 6th attempt is throttled
  const throttled = limiter.check(ip);
  assert.equal(throttled.success, false);
  assert.equal(throttled.remaining, 0);
  assert.ok(throttled.retryAfterMs > 0);

  const headers = getRateLimitHeaders(throttled, 5);
  assert.equal(headers["X-RateLimit-Limit"], "5");
  assert.equal(headers["X-RateLimit-Remaining"], "0");
  assert.ok(headers["Retry-After"]);
});

test("RateLimiter: storagePresignLimiter has a 30-request ceiling", () => {
  assert.equal(storagePresignLimiter.limit, 30);
  assert.equal(storagePresignLimiter.windowMs, 10 * 60_000);
});

test("RateLimiter: clientMessageLimiter has a 20-message ceiling", () => {
  assert.equal(clientMessageLimiter.limit, 20);
  assert.equal(clientMessageLimiter.windowMs, 5 * 60_000);
});

test("CSRF Origin: verifies origin matching logic", () => {
  function checkOriginAllowed(
    origin: string,
    host: string,
    configuredAppUrl?: string,
    isProduction = true
  ): boolean {
    try {
      const originHost = new URL(origin).host;
      const allowedAppHost = configuredAppUrl ? new URL(configuredAppUrl).host : null;

      return (
        originHost === host ||
        (allowedAppHost !== null && originHost === allowedAppHost) ||
        (!isProduction &&
          (originHost.startsWith("localhost:") ||
            originHost === "localhost" ||
            originHost.startsWith("127.0.0.1:")))
      );
    } catch {
      return false;
    }
  }

  const host = "buildora-gray.vercel.app";
  const appUrl = "https://buildora-gray.vercel.app";

  // Same origin -> ALLOWED
  assert.equal(checkOriginAllowed("https://buildora-gray.vercel.app", host, appUrl, true), true);

  // Cross-site origin (attacker site) -> BLOCKED
  assert.equal(checkOriginAllowed("https://evil-attacker.com", host, appUrl, true), false);

  // Cross-subdomain phishing -> BLOCKED
  assert.equal(checkOriginAllowed("https://fake-buildora.attacker.io", host, appUrl, true), false);

  // Localhost in dev mode -> ALLOWED
  assert.equal(checkOriginAllowed("http://localhost:3000", "localhost:3000", undefined, false), true);

  // Localhost in production mode targeting production host -> BLOCKED
  assert.equal(checkOriginAllowed("http://localhost:3000", host, appUrl, true), false);

  // Malformed origin header -> BLOCKED
  assert.equal(checkOriginAllowed("not-a-valid-url", host, appUrl, true), false);
});

test("API Error Masking: apiInternalError never exposes internal stack trace to client", async () => {
  const env = process.env as Record<string, string | undefined>;
  const originalEnv = env.NODE_ENV;
  try {
    env.NODE_ENV = "production";
    const sensitiveError = new Error("FATAL: database password leaked at /var/secrets.key:42");

    const response = apiInternalError(sensitiveError, "Unable to complete operation.");
    assert.equal(response.status, 500);

    const body = (await response.json()) as { success: boolean; error: string; details?: unknown };
    assert.equal(body.success, false);
    assert.equal(body.error, "Unable to complete operation.");
    // Ensure sensitive error details/stack trace are completely absent in production
    assert.equal(body.details, undefined);
  } finally {
    env.NODE_ENV = originalEnv;
  }
});