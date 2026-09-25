import { initializeApp, getApps, getApp, cert, applicationDefault, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

function initializeFirebaseAdmin(): App | null {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  try {
    // 1. Full JSON service account key
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      const decoded = serviceAccountJson.startsWith("{")
        ? JSON.parse(serviceAccountJson)
        : JSON.parse(Buffer.from(serviceAccountJson, "base64").toString("utf-8"));
      return initializeApp({
        credential: cert(decoded),
        projectId: decoded.project_id,
      });
    }

    // 2. Individual environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (projectId && clientEmail && privateKey) {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    }

    // 3. Fallback: Application Default Credentials
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCLOUD_PROJECT) {
      return initializeApp({
        credential: applicationDefault(),
      });
    }

    // 4. Default Project ID init
    if (projectId) {
      return initializeApp({ projectId });
    }

    return null;
  } catch (error) {
    console.error("[firebase-admin] Failed to initialize Firebase Admin SDK:", error);
    return null;
  }
}

const adminApp = initializeFirebaseAdmin();

export function getAdminApp(): App | null {
  return adminApp ?? initializeFirebaseAdmin();
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

export function getAdminDb(): Firestore | null {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}
