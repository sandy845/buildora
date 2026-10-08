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
    if (process.env.NODE_ENV !== "production") {
      try {
        let userEmail = options?.email?.trim();
        let userName = options?.name?.trim();

        if (typeof window !== "undefined") {
          const cachedEmail = localStorage.getItem("buildora_last_registered_email") || localStorage.getItem("buildora_dev_google_email") || "";
          const cachedName = localStorage.getItem("buildora_last_registered_name") || localStorage.getItem("buildora_dev_google_name") || "";

          if (!userEmail) {
            userEmail = cachedEmail;
          }
          if (!userName) {
            userName = cachedName;
          }

          if (!userEmail) {
            const entered = window.prompt(
              "Sign in with Google (Dev Mode):\nPlease enter your Google account email address:",
              "sandeepkami2005@gmail.com"
            );
            if (!entered) {
              return { success: false, error: "Google sign-in was cancelled." };
            }
            userEmail = entered.trim();
          }

          if (!userName) {
            const defaultName = userEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const entered = window.prompt("Enter your Google display name:", defaultName);
            userName = entered?.trim() || defaultName;
          }

          localStorage.setItem("buildora_dev_google_email", userEmail);
          if (userName) localStorage.setItem("buildora_dev_google_name", userName);
        }

        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken: "dev-mock-google-token",
            name: userName || "Client User",
            email: userEmail || "customer@example.com",
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
