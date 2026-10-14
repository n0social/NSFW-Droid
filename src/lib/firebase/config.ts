export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  /** GA4 measurement ID from Firebase web app config (same as NEXT_PUBLIC_GA_MEASUREMENT_ID). */
  measurementId?: string;
};

export function getFirebaseClientConfig(): FirebaseClientConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    ...(storageBucket ? { storageBucket } : {}),
    ...(messagingSenderId ? { messagingSenderId } : {}),
    ...(measurementId ? { measurementId } : {}),
  };
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseClientConfig() !== null;
}

/** Firebase Analytics SDK when web app config + measurement ID are present. */
export function isFirebaseAnalyticsEnabled(): boolean {
  const config = getFirebaseClientConfig();
  return config !== null && Boolean(config.measurementId);
}
