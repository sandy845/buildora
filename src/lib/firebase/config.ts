/**
 * Firebase Client and Server Configuration
 * Loads environment variables for Firebase Client and Firebase Admin SDK.
 */

export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export function isFirebaseClientConfigured(): boolean {
  return Boolean(
    firebaseClientConfig.apiKey &&
    firebaseClientConfig.projectId &&
    firebaseClientConfig.appId
  );
}

export function isFirebaseAdminConfigured(): boolean {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) return true;
  return Boolean(
    (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}
