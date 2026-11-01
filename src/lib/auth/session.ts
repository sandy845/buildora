import { createHmac, timingSafeEqual } from "node:crypto";
import type { UserRole } from "@/lib/types/models";

export type AuthRole = UserRole;

export type SessionPayload = {
  sessionId?: string;
  userId: string;
  role: AuthRole;
  email?: string;
  name?: string;
  createdAt?: number;
  expiresAt: number;
};

export function allowDevSessionFallback(): boolean {
  return process.env.ALLOW_DEV_SESSION_FALLBACK === "1" || process.env.NODE_ENV === "test";
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters in production.");
  }
  return secret || (allowDevSessionFallback() ? "buildora_test_session_key_32_chars_minimum_length" : "");
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(value: string): string {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export function createSessionToken(payload: SessionPayload): string {
  const body = encode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function readSessionToken(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const expectedSignature = sign(body);
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (
      !payload.userId ||
      !["customer", "admin"].includes(payload.role) ||
      !payload.expiresAt ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
