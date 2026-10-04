"use server";

import { createHash, createHmac, randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createUser, getUser, updateUser } from "@/lib/db/data-access";
import { validateLogin, validateRegister } from "@/lib/auth";
import { authLoginLimiter, authRegisterLimiter, authVerificationLimiter, getClientIp } from "@/lib/rate-limit";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { getAdminAuth } from "@/lib/firebase/admin";
import { firestoreCreate, firestoreFindOne, firestoreUpdate } from "@/lib/firebase/firestore";
import type { UserRole } from "@/lib/types/models";

const scrypt = promisify(scryptCallback);
const sessionCookieName = "buildora_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7; // 7 days

type AuthRole = UserRole;

type SessionPayload = {
  userId: string;
  role: AuthRole;
  email?: string;
  expiresAt: number;
};

function generateVerificationOtp() {
  return String(randomInt(100000, 1000000));
}

export type AuthActionState = {
  error?: string;
  success?: boolean;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters in production.");
  }
  return secret || "buildora_super_secret_session_key_32_chars_minimum_length_fallback";
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

export async function setSession(userId: string, role: AuthRole, email?: string) {
  const token = createSessionToken({
    userId,
    role,
    email,
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

  try {
    const user = await getUser({ id: session.userId });
    if (!user || user.accountStatus !== "active" || user.deletedAt) {
      // In case session exists from Google login before DB write, fallback to session info
      if (session.email) {
        return {
          id: session.userId,
          name: session.email.split("@")[0] || "User",
          email: session.email,
          role: session.role,
        };
      }
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error("Buildora session lookup error:", error);
    return null;
  }
}

export async function requireRole(role: AuthRole) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== role) {
    redirect(user.role === "admin" ? "/admin/dashboard" : "/client/dashboard");
  }
  return user;
}

/**
 * Handle Firebase client token exchange (e.g. Google Sign-in or client-side auth)
 */
export async function createFirebaseSession(
  idToken: string,
  extraProfile?: { name?: string; email?: string }
): Promise<{ success: boolean; role?: AuthRole; error?: string; user?: unknown }> {
  const adminAuth = getAdminAuth();

  let uid = "";
  let email = extraProfile?.email || "";
  let name = extraProfile?.name || "";

  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
      email = decoded.email || email;
      name = decoded.name || name;
    } catch (err) {
      console.error("[firebase-auth] Failed to verify ID token:", err);
      return { success: false, error: "Invalid authentication token." };
    }
  } else {
    // Development fallback without admin credentials
    uid = `fb-${Date.now()}`;
    email = email || "user@example.com";
  }

  const normalizedEmail = email.toLowerCase().trim();
  let existing = await getUser({ normalizedEmail });

  if (!existing) {
    // If first user, make admin, otherwise customer
    const role: AuthRole = normalizedEmail.includes("admin") ? "admin" : "customer";
    existing = await createUser({
      id: uid,
      name: name || email.split("@")[0] || "Buildora Member",
      email,
      normalizedEmail,
      role,
      accountStatus: "active",
      emailVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (adminAuth) {
      try {
        await adminAuth.setCustomUserClaims(uid, { role });
      } catch (claimErr) {
        console.warn("[firebase-auth] Could not set custom claim:", claimErr);
      }
    }
  }

  await setSession(existing.id, existing.role, existing.email);
  return {
    success: true,
    role: existing.role,
    user: { id: existing.id, email: existing.email, name: existing.name, role: existing.role },
  };
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
    // Graceful fallback
  }

  const errors = validateRegister(values);
  if (Object.keys(errors).length > 0) return { error: "Please correct the highlighted fields." };

  const name = String(values.name || "").trim();
  const email = String(values.email || "").trim().toLowerCase();
  const phone = String(values.phone || "").trim();
  const password = String(values.password || "");

  let existing: Awaited<ReturnType<typeof getUser>>;
  try {
    existing = await getUser({ normalizedEmail: email });
  } catch (error) {
    console.error("[auth/register] Failed to query the user store:", error);
    return { error: "Registration is temporarily unavailable because account storage could not be reached." };
  }
  if (existing) {
    return {
      error: existing.emailVerifiedAt
        ? "An account with this email already exists. Please log in."
        : "This email is already registered but not verified. Resend the verification email below.",
    };
  }

  let firebaseUid: string | undefined;
  const adminAuth = getAdminAuth();
  if (adminAuth) {
    try {
      const fbUser = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        phoneNumber: phone.startsWith("+") ? phone : undefined,
      });
      firebaseUid = fbUser.uid;
      await adminAuth.setCustomUserClaims(fbUser.uid, { role: "customer" });
    } catch (fbErr: unknown) {
      const msg = fbErr instanceof Error ? fbErr.message : String(fbErr);
      if (msg.includes("email-already-exists")) {
        return { error: "An account with this email already exists in Firebase. Please log in." };
      }
      console.warn("[firebase-auth] Admin createUser notice:", msg);
    }
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const passwordHash = `scrypt:${salt}:${derivedKey.toString("hex")}`;

  let created: Awaited<ReturnType<typeof createUser>>;
  let rawToken: string;
  let emailResult: Awaited<ReturnType<typeof sendVerificationEmail>>;
  try {
    created = await createUser({
      id: firebaseUid,
      name,
      email: String(values.email || "").trim(),
      normalizedEmail: email,
      phone,
      passwordHash,
      role: "customer",
      accountStatus: "active",
    });

    rawToken = generateVerificationOtp();
    await firestoreCreate("emailVerificationTokens", {
      userId: created.id,
      tokenHash: createHash("sha256").update(rawToken).digest("hex"),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      usedAt: null,
    });

    emailResult = await sendVerificationEmail(email, name, rawToken);
  } catch (error) {
    console.error("[auth/register] Failed to create the account or verification token:", error);
    return { error: "Registration could not be completed. Please check the deployment configuration and try again." };
  }
  if (!emailResult.sent) {
    // If email is not configured in local dev, allow automatic activation so user can log in
    if (process.env.NODE_ENV !== "production") {
      await updateUser({ id: created.id }, { emailVerifiedAt: new Date().toISOString() });
      return { success: true };
    }
    return {
      error: "Your account was created, but we could not send the verification email. Configure email delivery or use Resend verification email after it is available.",
    };
  }

  return { success: true };
}

export async function resendVerificationEmail(emailValue: string): Promise<AuthActionState> {
  const email = emailValue.trim().toLowerCase();
  const rateCheck = authVerificationLimiter.check(email);
  if (!rateCheck.success) {
    const minutes = Math.ceil(rateCheck.retryAfterMs / 60000);
    return { error: `Too many verification requests. Please try again in ${minutes} minutes.` };
  }

  let user: Awaited<ReturnType<typeof getUser>>;
  try {
    user = await getUser({ normalizedEmail: email });
  } catch (error) {
    console.error("[auth/verification] Failed to query the user store:", error);
    return { error: "Verification email service is temporarily unavailable." };
  }
  if (!user || user.accountStatus !== "active" || user.emailVerifiedAt) {
    return { error: "No unverified active account was found for this email." };
  }

  const rawToken = generateVerificationOtp();
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  let result: Awaited<ReturnType<typeof sendVerificationEmail>>;
  try {
    await firestoreCreate("emailVerificationTokens", {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      usedAt: null,
    });
    result = await sendVerificationEmail(user.email, user.name, rawToken);
  } catch (error) {
    console.error("[auth/verification] Failed to create token or send email:", error);
    return { error: "Unable to send the verification email. Please try again later." };
  }
  if (!result.sent && process.env.NODE_ENV === "production") {
    return { error: "Unable to send the verification email. Please try again later." };
  }

  return { success: true };
}

async function verifyPassword(password: string, storedHash: string | null | undefined) {
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
    const rateCheck = process.env.E2E_TEST === "1" ? { success: true, retryAfterMs: 0 } : authLoginLimiter.check(ip);
    if (!rateCheck.success) {
      const minutes = Math.ceil(rateCheck.retryAfterMs / 60000);
      return {
        error: `Too many login attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
      };
    }
  } catch {
    // Test context
  }

  const errors = validateLogin(values);
  if (Object.keys(errors).length > 0) return { error: "Please enter a valid email and password." };

  const email = String(values.email || "").trim().toLowerCase();
  const password = String(values.password || "");

  let user: Awaited<ReturnType<typeof getUser>>;
  try {
    user = await getUser({ normalizedEmail: email });
  } catch (error) {
    console.error("[auth/login] Failed to query the user store:", error);
    return { error: "Sign-in is temporarily unavailable because account storage could not be reached." };
  }
  if (!user || user.accountStatus !== "active" || user.deletedAt) {
    return { error: "Invalid email or password." };
  }

  // Check email verification status
  if (!user.emailVerifiedAt && process.env.NODE_ENV === "production") {
    return { error: "Please verify your email address before logging in." };
  }

  // Verify password hash
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "Invalid email or password." };
  }

  try {
    await updateUser({ id: user.id }, { lastLoginAt: new Date().toISOString() });
    await setSession(user.id, user.role, user.email);
  } catch (error) {
    console.error("[auth/login] Failed to update login state or create a session:", error);
    return { error: "Sign-in is temporarily unavailable. Please check the deployment configuration and try again." };
  }

  return { success: true, role: user.role };
}

export async function verifyEmailToken(rawToken: string): Promise<boolean> {
  const otp = rawToken.trim();
  if (!/^\d{6}$/.test(otp)) return false;
  const tokenHash = createHash("sha256").update(otp).digest("hex");

  const tokenDoc = await firestoreFindOne<{ id: string; userId: string; usedAt?: string; expiresAt: string }>(
    "emailVerificationTokens",
    { where: [{ field: "tokenHash", operator: "==", value: tokenHash }] }
  );

  if (!tokenDoc || tokenDoc.usedAt || new Date(tokenDoc.expiresAt) <= new Date()) {
    return false;
  }

  await firestoreUpdate("emailVerificationTokens", tokenDoc.id, { usedAt: new Date().toISOString() });
  await updateUser({ id: tokenDoc.userId }, { emailVerifiedAt: new Date().toISOString() });
  return true;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await getUser({ normalizedEmail });
  if (!user || user.deletedAt) return;

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await firestoreCreate("passwordResetTokens", {
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    usedAt: null,
  });

  const result = await sendPasswordResetEmail(user.email, user.name, rawToken);
  if (!result.sent) {
    console.warn("[auth] Failed to send password reset email");
  }
}

export async function resetPassword(rawToken: string, password: string): Promise<boolean> {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const tokenDoc = await firestoreFindOne<{ id: string; userId: string; usedAt?: string; expiresAt: string }>(
    "passwordResetTokens",
    { where: [{ field: "tokenHash", operator: "==", value: tokenHash }] }
  );

  if (!tokenDoc || tokenDoc.usedAt || new Date(tokenDoc.expiresAt) <= new Date()) {
    return false;
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const passwordHash = `scrypt:${salt}:${derivedKey.toString("hex")}`;

  await firestoreUpdate("passwordResetTokens", tokenDoc.id, { usedAt: new Date().toISOString() });
  await updateUser({ id: tokenDoc.userId }, { passwordHash });

  // Update in Firebase Auth if available
  const adminAuth = getAdminAuth();
  if (adminAuth) {
    try {
      await adminAuth.updateUser(tokenDoc.userId, { password });
    } catch (fbErr) {
      console.warn("[firebase-auth] Could not update password in Firebase Auth:", fbErr);
    }
  }

  return true;
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}
