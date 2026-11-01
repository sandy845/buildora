import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionToken,
  readSessionToken,
} from "../src/lib/auth/session.ts";
import {
  verifyPassword,
} from "../src/lib/auth/server.ts";
import {
  isSessionTokenRevoked,
  isUserSessionRevoked,
  revokeAllUserSessions,
  revokeSessionToken,
} from "../src/lib/auth/revocation.ts";
import { scryptSync, randomBytes } from "node:crypto";

function generateTestHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

test("Session: createSessionToken and readSessionToken round-trip", () => {
  const sessionId = "sess-123456";
  const now = Date.now();
  const token = createSessionToken({
    sessionId,
    userId: "user-123",
    role: "customer",
    email: "test@buildora.in",
    name: "Test User",
    createdAt: now,
    expiresAt: now + 60_000,
  });

  const parsed = readSessionToken(token);
  assert.ok(parsed);
  assert.equal(parsed.userId, "user-123");
  assert.equal(parsed.sessionId, sessionId);
  assert.equal(parsed.role, "customer");
  assert.equal(parsed.email, "test@buildora.in");
});

test("Session: rejects tampered token body or signature", () => {
  const now = Date.now();
  const token = createSessionToken({
    sessionId: "sess-tamper",
    userId: "user-123",
    role: "customer",
    createdAt: now,
    expiresAt: now + 60_000,
  });

  const [body, sig] = token.split(".");
  // Tamper with signature
  const tamperedSig = sig.slice(0, -4) + "XXXX";
  assert.equal(readSessionToken(`${body}.${tamperedSig}`), null);

  // Tamper with body
  const tamperedBody = Buffer.from(JSON.stringify({ userId: "admin", role: "admin", expiresAt: now + 60000 })).toString("base64url");
  assert.equal(readSessionToken(`${tamperedBody}.${sig}`), null);
});

test("Session: rejects expired session tokens", () => {
  const token = createSessionToken({
    sessionId: "sess-expired",
    userId: "user-123",
    role: "customer",
    createdAt: Date.now() - 100_000,
    expiresAt: Date.now() - 1000, // In the past
  });

  assert.equal(readSessionToken(token), null);
});

test("Session: rejects invalid user roles", () => {
  const token = createSessionToken({
    sessionId: "sess-role",
    userId: "user-123",
    // @ts-expect-error Testing invalid runtime role
    role: "superadmin",
    createdAt: Date.now(),
    expiresAt: Date.now() + 60_000,
  });

  assert.equal(readSessionToken(token), null);
});

test("Revocation: individual session token can be revoked", async () => {
  const sessionId = `sess-${Date.now()}`;
  const expiresAt = Date.now() + 60_000;

  // Initially not revoked
  assert.equal(await isSessionTokenRevoked(sessionId), false);

  // Revoke session
  await revokeSessionToken(sessionId, expiresAt);

  // Now revoked
  assert.equal(await isSessionTokenRevoked(sessionId), true);
});

test("Revocation: user-wide session invalidation invalidates prior sessions", async () => {
  const userId = `user-rev-${Date.now()}`;
  const oldSessionTime = Date.now() - 5000;

  // Initially not revoked
  assert.equal(await isUserSessionRevoked(userId, oldSessionTime), false);

  // Trigger user-wide revocation (e.g. password reset)
  await revokeAllUserSessions(userId);

  // Old session is now revoked
  assert.equal(await isUserSessionRevoked(userId, oldSessionTime), true);

  // New session issued after revocation is valid
  const newSessionTime = Date.now() + 5000;
  assert.equal(await isUserSessionRevoked(userId, newSessionTime), false);
});

test("Password Hashing: verifyPassword correctly validates scrypt credentials", async () => {
  const password = "SuperSecretPassword123!";
  const hash = generateTestHash(password);

  // Valid password matches
  const valid = await verifyPassword(password, hash);
  assert.equal(valid, true);

  // Wrong password rejected
  const invalid = await verifyPassword("WrongPassword123!", hash);
  assert.equal(invalid, false);

  // Empty password rejected
  const empty = await verifyPassword("", hash);
  assert.equal(empty, false);

  // Malformed hash rejected
  assert.equal(await verifyPassword(password, "invalid:hash"), false);
  assert.equal(await verifyPassword(password, null), false);
  assert.equal(await verifyPassword(password, undefined), false);
});

