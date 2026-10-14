import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

function parseServiceAccount(): Record<string, string> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
}

export function getFirebaseAdminApp(): App | null {
  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) return null;
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  return initializeApp({ credential: cert(serviceAccount) });
}

export function getFirebaseAdminAuth(): Auth | null {
  const app = getFirebaseAdminApp();
  return app ? getAuth(app) : null;
}

export function isFirebaseAdminConfigured(): boolean {
  return parseServiceAccount() !== null;
}
