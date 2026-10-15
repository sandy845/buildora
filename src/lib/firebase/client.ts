"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import { firebaseClientConfig, isFirebaseClientConfigured } from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (typeof window !== "undefined" && isFirebaseClientConfigured()) {
  app = getApps().length === 0 ? initializeApp(firebaseClientConfig) : getApp();
  auth = getAuth(app);
}

export function getClientApp(): FirebaseApp | undefined {
  if (!app && typeof window !== "undefined" && isFirebaseClientConfigured()) {
    app = getApps().length === 0 ? initializeApp(firebaseClientConfig) : getApp();
  }
  return app;
}

export function getClientAuth(): Auth | undefined {
  if (!auth) {
    const clientApp = getClientApp();
    if (clientApp) {
      auth = getAuth(clientApp);
    }
  }
  return auth;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export type GoogleSignInOptions = {
  name?: string;
  email?: string;
};

/**
 * Sign in with Google on the client and establish a server session.
 */
export async function signInWithGoogle(options?: GoogleSignInOptions): Promise<{ success: boolean; error?: string; user?: unknown }> {
  const clientAuth = getClientAuth();
  if (!clientAuth) {
    return {
      success: false,
      error: "Firebase Client is not configured. Please add NEXT_PUBLIC_FIREBASE_* variables to .env and ensure the app is running behind a valid Firebase project.",
    };
  }

  try {
    const cred: UserCredential = await signInWithPopup(clientAuth, googleProvider);
    const idToken = await cred.user.getIdToken();

    // Exchange ID token for a secure session cookie
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        name: cred.user.displayName || options?.name || "",
        email: cred.user.email || options?.email || "",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to establish session." };
    }

    return { success: true, user: data.user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("popup-closed-by-user")) {
      return { success: false, error: "Sign in was cancelled." };
    }
    if (message.includes("auth/unauthorized-domain")) {
      const currentHost = typeof window !== "undefined" ? window.location.hostname : "your current domain";
      return {
        success: false,
        error: `Domain unauthorized: "${currentHost}" is not added in Firebase Console. Add "${currentHost}" under Firebase Console -> Authentication -> Settings -> Authorized Domains.`,
      };
    }
    return { success: false, error: message };
  }
}

/**
 * Sign in with email and password via Firebase client SDK.
 */
export async function signInWithFirebaseEmail(
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string; role?: string; fallbackToDatabase?: boolean }> {
  const clientAuth = getClientAuth();
  if (!clientAuth) {
    return {
      success: false,
      error: "Firebase Client is not configured. Please check your environment variables.",
    };
  }

  try {
    const cred = await signInWithEmailAndPassword(clientAuth, email, pass);
    await cred.user.reload();
    if (!cred.user.emailVerified) {
      return { success: false, error: "Please verify your email address using the link we sent before logging in." };
    }
    const idToken = await cred.user.getIdToken(true);

    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to establish session." };
    }

    return { success: true, role: data.user?.role };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("auth/user-not-found")) {
      return {
        success: false,
        error: "Invalid email or password.",
        fallbackToDatabase: true,
      };
    }
    if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")) {
      return { success: false, error: "Invalid email or password." };
    }
    if (message.includes("auth/too-many-requests")) {
      return { success: false, error: "Too many failed attempts. Please try again later." };
    }
    if (message.includes("auth/unauthorized-domain")) {
      const currentHost = typeof window !== "undefined" ? window.location.hostname : "your current domain";
      return {
        success: false,
        error: `Domain unauthorized: "${currentHost}" is not added in Firebase Console. Add "${currentHost}" under Firebase Console -> Authentication -> Settings -> Authorized Domains.`,
      };
    }
    return { success: false, error: message };
  }
}

export async function sendFirebaseVerificationEmail(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const clientAuth = getClientAuth();
  if (!clientAuth) {
    return { success: false, error: "Firebase Authentication is not configured." };
  }

  try {
    const credential = await signInWithEmailAndPassword(clientAuth, email, password);
    if (credential.user.emailVerified) {
      return { success: true };
    }
    await sendEmailVerification(credential.user, {
      url: `${window.location.origin}/auth/verify?provider=firebase&verified=1`,
    });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("auth/unauthorized-domain")) {
      return {
        success: false,
        error: `Add "${window.location.hostname}" to Firebase Authentication's authorized domains.`,
      };
    }
    if (message.includes("auth/invalid-credential") || message.includes("auth/user-not-found")) {
      return { success: false, error: "Could not sign in to send the verification link. Check the email and password." };
    }
    return { success: false, error: "Could not send the verification link. Please try again." };
  }
}

export async function sendFirebaseVerificationEmailToCurrentUser(): Promise<{ success: boolean; error?: string }> {
  const clientAuth = getClientAuth();
  const user = clientAuth?.currentUser;
  if (!user) {
    return { success: false, error: "Please register again to resend the verification link." };
  }

  try {
    await sendEmailVerification(user, {
      url: `${window.location.origin}/auth/verify?provider=firebase&verified=1`,
    });
    return { success: true };
  } catch {
    return { success: false, error: "Could not resend the verification link. Please try again." };
  }
}

export async function syncCurrentFirebaseSession(): Promise<{ success: boolean; error?: string }> {
  const user = getClientAuth()?.currentUser;
  if (!user) return { success: false };

  try {
    await user.reload();
    if (!user.emailVerified) return { success: false };
    const idToken = await user.getIdToken(true);
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!response.ok) {
      const data = await response.json() as { error?: string };
      return { success: false, error: data.error || "Could not finish account verification." };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Could not finish account verification. Please log in and try again." };
  }
}

/**
 * Reset password via Firebase Auth.
 */
export async function sendFirebasePasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  const clientAuth = getClientAuth();
  if (!clientAuth) {
    return { success: false, error: "Firebase Client is not configured." };
  }

  try {
    await sendPasswordResetEmail(clientAuth, email, {
      url: `${window.location.origin}/auth/login?reset=firebase`,
    });
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Sign out of Firebase client.
 */
export async function signOutFirebase(): Promise<void> {
  const clientAuth = getClientAuth();
  if (clientAuth) {
    await signOut(clientAuth).catch(() => {});
  }
}
