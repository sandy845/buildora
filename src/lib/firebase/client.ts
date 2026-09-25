"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseClientConfig, isFirebaseClientConfigured } from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== "undefined" && isFirebaseClientConfigured()) {
  app = getApps().length === 0 ? initializeApp(firebaseClientConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
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

export function getClientDb(): Firestore | undefined {
  if (!db) {
    const clientApp = getClientApp();
    if (clientApp) {
      db = getFirestore(clientApp);
    }
  }
  return db;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Sign in with Google on the client and establish a server session.
 */
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string; user?: unknown }> {
  const clientAuth = getClientAuth();
  if (!clientAuth) {
    if (process.env.NODE_ENV !== "production") {
      try {
        // Development fallback: establish session with a dev account
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken: "dev-mock-google-token",
            name: "Demo Customer",
            email: "client@buildora.in",
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          return { success: true, user: data.user };
        }
      } catch (err) {
        console.warn("[dev-auth] Mock Google sign-in fallback failed:", err);
      }
    }

    return {
      success: false,
      error: "Firebase Client is not configured. Please add NEXT_PUBLIC_FIREBASE_* variables to .env",
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
        name: cred.user.displayName || "",
        email: cred.user.email || "",
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
    return { success: false, error: message };
  }
}

/**
 * Sign in with email and password via Firebase client SDK.
 */
export async function signInWithFirebaseEmail(
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string; role?: string }> {
  const clientAuth = getClientAuth();
  if (!clientAuth) {
    return {
      success: false,
      error: "Firebase Client is not configured. Please check your environment variables.",
    };
  }

  try {
    const cred = await signInWithEmailAndPassword(clientAuth, email, pass);
    const idToken = await cred.user.getIdToken();

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
    if (message.includes("auth/invalid-credential") || message.includes("auth/user-not-found") || message.includes("auth/wrong-password")) {
      return { success: false, error: "Invalid email or password." };
    }
    if (message.includes("auth/too-many-requests")) {
      return { success: false, error: "Too many failed attempts. Please try again later." };
    }
    return { success: false, error: message };
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
    await sendPasswordResetEmail(clientAuth, email);
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
