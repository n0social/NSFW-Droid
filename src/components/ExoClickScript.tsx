"use client";

import Script from "next/script";
import { exoclickAdScriptUrl, exoclickLiveReady } from "@/lib/ads-config";

type Props = {
  ageVerified: boolean;
};

/**
 * Loads the ExoClick ad provider once per page (deduped by `id`), only when ads are
 * enabled, age-verified, and zone + script URL are configured.
 */
export function ExoClickScript({ ageVerified }: Props) {
  if (!ageVerified || !exoclickLiveReady()) {
    return null;
  }

  const src = exoclickAdScriptUrl();
  if (!src) return null;

  return (
    <Script
      id="exoclick-ad-provider"
      src={src}
      strategy="afterInteractive"
      async
    />
  );
}
