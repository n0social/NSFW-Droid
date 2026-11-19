"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  adsPublicConfigFromEnv,
  type AdsPublicConfig,
} from "@/lib/ads-public-config";

const AdsConfigContext = createContext<AdsPublicConfig | null>(null);

export function AdsConfigProvider({
  config,
  children,
}: {
  config: AdsPublicConfig;
  children: ReactNode;
}) {
  return <AdsConfigContext.Provider value={config}>{children}</AdsConfigContext.Provider>;
}

/** Live config from the server when wrapped in AdsConfigProvider; else build-time env (dev/tests). */
export function useAdsPublicConfig(): AdsPublicConfig {
  const ctx = useContext(AdsConfigContext);
  return ctx ?? adsPublicConfigFromEnv();
}