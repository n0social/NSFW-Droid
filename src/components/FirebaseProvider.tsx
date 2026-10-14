"use client";

import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { useEffect, type ReactNode } from "react";
import { getFirebaseApp } from "@/lib/firebase/client";
import { isFirebaseAnalyticsEnabled } from "@/lib/firebase/config";

let analytics: Analytics | undefined;

export function FirebaseProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined" || !isFirebaseAnalyticsEnabled()) return;

    void isSupported().then((supported) => {
      if (!supported) return;
      const app = getFirebaseApp();
      if (!app || analytics) return;
      analytics = getAnalytics(app);
    });
  }, []);

  return children;
}
