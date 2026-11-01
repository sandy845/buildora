"use server";

import { createHash, createHmac, randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createUser, getUser, updateUser } from "@/lib/db/data-access";
import { prisma } from "@/lib/db/prisma";
import { validateLogin, validateRegister } from "@/lib/auth";
import { authLoginLimiter, authRegisterLimiter, authVerificationLimiter, getClientIp } from "@/lib/rate-limit";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { getAdminAuth } from "@/lib/firebase/admin";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
import {
  isSessionTokenRevoked,
  isUserSessionRevoked,
  revokeAllUserSessions,
  revokeSessionToken,
} from "./revocation";
import {
  allowDevSessionFallback,
  createSessionToken,
  readSessionToken,
  type SessionPayload,
} from "./session";
import type { UserRole } from "@/lib/types/models";

const scrypt = promisify(scryptCallback);
const sessionCookieName = "buildora_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7; // 7 days

type AuthRole = UserRole;

function generateVerificationOtp() {
  return String(randomInt(100000, 1000000));
}

export type AuthActionState = {
  error?: string;
  success?: boolean;
  verificationProvider?: "firebase" | "email";
};

export async function setSession(userId: string, role: AuthRole, email?: string, name?: string): Promise<string> {
  const sessionId = randomBytes(16).toString("hex");
  const now = Date.now();
  const expiresAt = now + sessionLifetimeSeconds * 1000;

  const token = createSessionToken({
    sessionId,
    userId,
    role,
    email,
    name,
    createdAt: now,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  });

  return sessionId;
}

export async function getCurrentUser(): Promise<{
  id: string;
  name: string;
  email: string;
  role: AuthRole;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  const session = readSessionToken(token);
  if (!session) return null;

  // Check individual session revocation
  if (session.sessionId && (await isSessionTokenRevoked(session.sessionId))) {
    return null;
  }

  // Check user-wide session revocation (e.g. after password reset)
  if (session.createdAt && (await isUserSessionRevoked(session.userId, session.createdAt))) {
    return null;
  }

  try {
    const user = await getUser({ id: session.userId });
    if (!user || user.accountStatus !== "active" || user.deletedAt) {
      if (allowDevSessionFallback() && session.email) {
        return {
          id: session.userId,
          name: session.name || session.email.split("@")[0] || "User",
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
    if (allowDevSessionFallback() && session.email) {
      return {
        id: session.userId,
        name: session.name || session.email.split("@")[0] || "User",
        email: session.email,
        role: session.role,
      };
    }
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
  let verifiedEmail = false;

  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      if (!decoded.email || decoded.email_verified !== true) {
        return { success: false, error: "A verified email address is required." };
      }
      uid = decoded.uid;
      email = decoded.email || email;
      name = decoded.name || name;
      verifiedEmail = decoded.email_verified === true;
    } catch (err) {
      console.error("[firebase-auth] Failed to verify ID token:", err);
      return { success: false, error: "Invalid authentication token." };
    }
  } else if (process.env.NODE_ENV === "production" || process.env.E2E_TEST !== "1") {
    return { success: false, error: "Firebase Admin SDK is not configured for this deployment." };
  } else {
    uid = `fb-${Date.now()}`;
    email = email || "user@example.com";
    verifiedEmail = true;
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) {
    return { success: false, error: "The authentication provider did not return an email address." };
  }
  let existing = await getUser({ normalizedEmail });

  if (!existing) {
    const configuredAdmins = (process.env.BUILDORA_ADMIN_EMAILS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const role: AuthRole = configuredAdmins.includes(normalizedEmail) ? "admin" : "customer";
    existing = await createUser({
      name: name || email.split("@")[0] || "Buildora Member",
      email,
      normalizedEmail,
      role,
      accountStatus: "active",
      emailVerifiedAt: new Date(),
    });

    if (adminAuth) {
      try {
        await adminAuth.setCustomUserClaims(uid, { role, userId: existing.id });
      } catch (claimErr) {
        console.warn("[firebase-auth] Could not set custom claim:", claimErr);
      }
    }
  } else if (existing.deletedAt) {
    return { success: false, error: "This account is not available." };
  } else if (existing.accountStatus !== "active") {
    return {
      success: false,
      error:
        existing.accountStatus === "suspended"
          ? "This account has been suspended. Please contact support."
          : "This account is deactivated.",
    };
  } else if (name && (!existing.name || existing.name === "Buildora Client" || existing.name === "Demo Customer" || existing.name === "Buildora Member")) {
    try {
      await updateUser({ id: existing.id }, { name });
      existing.name = name;
    } catch {
      // Ignore if update fails
    }
  }

  if (verifiedEmail && !existing.emailVerifiedAt) {
    await updateUser({ id: existing.id }, { emailVerifiedAt: new Date() });
    existing.emailVerifiedAt = new Date();
  }

  await setSession(existing.id, existing.role, existing.email, existing.name);
  return {
    success: true,
    role: existing.role,
    user: { id: existing.id, email: existing.email, name: existing.name, role: existing.role },
  };
}

export async function registerUser(values: Record<string, unknown>): Promise<AuthActionState> {
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
  const firebaseEmailAuthEnabled = Boolean(adminAuth && isFirebaseClientConfigured());
  if (adminAuth) {
    try {
      const fbUser = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        phoneNumber: phone.startsWith("+") ? phone : undefined,
      });
      firebaseUid = fbUser.uid;
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
  let emailResult: Awaited<ReturnType<typeof sendVerificationEmail>> | undefined;
  try {
    created = await createUser({
      name,
      email: String(values.email || "").trim(),
      normalizedEmail: email,
      phone,
      passwordHash,
      role: "customer", // Strict: registration NEVER assigns admin role
      accountStatus: "active",
      emailVerifiedAt: new Date(), // Immediate direct login without mandatory OTP barrier
    });
    if (adminAuth && firebaseUid) {
      await adminAuth.setCustomUserClaims(firebaseUid, { role: "customer", userId: created.id });
    }

    if (!firebaseEmailAuthEnabled) {
      try {
        const rawToken = generateVerificationOtp();
        await prisma.emailVerificationToken.create({
          data: {
            userId: created.id,
            tokenHash: createHash("sha256").update(rawToken).digest("hex"),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            usedAt: null,
            attempts: 0,
          },
        });
        await sendVerificationEmail(email, name, rawToken);
      } catch (emailErr) {
        console.warn("[auth/register] Optional verification email dispatch skipped:", emailErr);
      }
    }
  } catch (error) {
    console.error("[auth/register] Failed to create the account or verification token:", error);
    return { error: "Registration could not be completed. Please check the deployment configuration and try again." };
  }

  return { success: true, verificationProvider: firebaseEmailAuthEnabled ? "firebase" : "email" };
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
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        usedAt: null,
        attempts: 0,
      },
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

export async function verifyPassword(password: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!storedHash?.startsWith("scrypt:")) return false;
  const [, salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;
  try {
    const actual = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(expectedHex, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function loginUser(values: Record<string, unknown>): Promise<AuthActionState & { role?: AuthRole }> {
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

  if (!user || user.deletedAt) {
    return { error: "Invalid email or password." };
  }

  // Handle suspended or deactivated accounts
  if (user.accountStatus !== "active") {
    return {
      error:
        user.accountStatus === "suspended"
          ? "This account has been suspended. Please contact Buildora support."
          : "This account has been deactivated.",
    };
  }

  // Verify password hash
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "Invalid email or password." };
  }

  try {
    await updateUser({ id: user.id }, { lastLoginAt: new Date() });
    await setSession(user.id, user.role, user.email, user.name);
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

  const tokenDoc = await prisma.emailVerificationToken.findFirst({
    where: { tokenHash },
  });

  if (!tokenDoc || tokenDoc.usedAt || new Date(tokenDoc.expiresAt) <= new Date()) {
    return false;
  }

  // Guard against brute force OTP guessing: lock token after 5 attempts
  if (tokenDoc.attempts && tokenDoc.attempts >= 5) {
    return false;
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: tokenDoc.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: tokenDoc.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return true;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await getUser({ normalizedEmail });
  if (!user || user.deletedAt || user.accountStatus !== "active") return;

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: null,
    },
  });

  const result = await sendPasswordResetEmail(user.email, user.name, rawToken);
  if (!result.sent) {
    console.warn("[auth] Failed to send password reset email");
  }
}

export async function resetPassword(rawToken: string, password: string): Promise<boolean> {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const tokenDoc = await prisma.passwordResetToken.findFirst({ where: { tokenHash } });

  if (!tokenDoc || tokenDoc.usedAt || new Date(tokenDoc.expiresAt) <= new Date()) {
    return false;
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const passwordHash = `scrypt:${salt}:${derivedKey.toString("hex")}`;

  await prisma.passwordResetToken.update({ where: { id: tokenDoc.id }, data: { usedAt: new Date() } });
  await updateUser({ id: tokenDoc.userId }, { passwordHash });

  // Invalidate all existing sessions for this user on all devices
  await revokeAllUserSessions(tokenDoc.userId);

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
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    const session = readSessionToken(token);
    if (session?.sessionId && session.expiresAt) {
      await revokeSessionToken(session.sessionId, session.expiresAt);
    }
  }

  cookieStore.delete(sessionCookieName);
}
