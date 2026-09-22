"use server";

import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createUser, getUser, updateUser } from "@/lib/db/data-access";
import { validateLogin, validateRegister } from "@/lib/auth";
import { safeDatabaseOperation } from "@/lib/services/shared";
import { authLoginLimiter, authRegisterLimiter, getClientIp } from "@/lib/rate-limit";

const scrypt = promisify(scryptCallback);
const sessionCookieName = "buildora_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;

type AuthRole = "customer" | "admin";

type SessionPayload = {
  userId: string;
  role: AuthRole;
  expiresAt: number;
};

export type AuthActionState = {
  error?: string;
  success?: boolean;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function createSessionToken(payload: SessionPayload) {
  const body = encode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function readSessionToken(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expectedSignature = sign(body);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || !["customer", "admin"].includes(payload.role) || payload.expiresAt <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function setSession(userId: string, role: AuthRole) {
  const token = createSessionToken({
    userId,
    role,
    expiresAt: Date.now() + sessionLifetimeSeconds * 1000,
  });
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  const session = readSessionToken(token);
  if (!session) return null;

  let user;
  try {
    user = await getUser({ id: session.userId });
  } catch (error) {
    console.error("Buildora session lookup failed", error);
    return null;
  }
  if (!user || user.accountStatus !== "active" || user.deletedAt) return null;
  if (user.role !== session.role) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function requireRole(role: AuthRole) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== role) redirect(user.role === "admin" ? "/admin/dashboard" : "/client/dashboard");
  return user;
}

export async function registerUser(values: Record<string, unknown>): Promise<AuthActionState> {
  // Rate limiting per IP
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const rateCheck = authRegisterLimiter.check(ip);
    if (!rateCheck.success) {
      const minutes = Math.ceil(rateCheck.retryAfterMs / 60000);
      return {
        error: `Too many registration attempts from this network. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
      };
    }
  } catch {
    // If headers() is unavailable in test context, continue gracefully
  }

  const errors = validateRegister(values);
  if (Object.keys(errors).length > 0) return { error: "Please correct the highlighted fields." };

  const name = values.name as string;
  const email = (values.email as string).trim().toLowerCase();
  const phone = values.phone as string;
  const password = values.password as string;
  const existing = await safeDatabaseOperation(() => getUser({ normalizedEmail: email }));
  if (existing) return { error: "Unable to create an account with those details." };

  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  await safeDatabaseOperation(() => createUser({
    name: name.trim(),
    email: (values.email as string).trim(),
    normalizedEmail: email,
    phone: phone.trim(),
    passwordHash: `scrypt:${salt}:${derivedKey.toString("hex")}`,
    role: "customer",
    accountStatus: "active",
  }));

  return { success: true };
}

async function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash?.startsWith("scrypt:")) return false;
  const [, salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function loginUser(values: Record<string, unknown>): Promise<AuthActionState & { role?: AuthRole }> {
  // Rate limiting per IP
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const rateCheck = authLoginLimiter.check(ip);
    if (!rateCheck.success) {
      const minutes = Math.ceil(rateCheck.retryAfterMs / 60000);
      return {
        error: `Too many login attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
      };
    }
  } catch {
    // If headers() is unavailable in test context, continue gracefully
  }

  const errors = validateLogin(values);
  if (Object.keys(errors).length > 0) return { error: "Please enter a valid email and password." };

  const email = values.email as string;
  const password = values.password as string;
  const user = await safeDatabaseOperation(() => getUser({ normalizedEmail: email.trim().toLowerCase() }));
  if (!user || user.accountStatus !== "active" || user.deletedAt || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await safeDatabaseOperation(() => updateUser({ id: user.id }, { lastLoginAt: new Date() }));
  await setSession(user.id, user.role);
  return { success: true, role: user.role };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}
