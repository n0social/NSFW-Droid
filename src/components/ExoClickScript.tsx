"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useAdsPublicConfig } from "@/components/AdsConfigProvider";
import { pushExoClickServe } from "@/lib/ads-config";
import { exoclickLiveReadyFromConfig } from "@/lib/ads-public-config";

type Props = {
  ageVerified: boolean;
};

function exoclickScriptSelector(src: string): string {
  return `script[src="${src}"]`;
}

/**
 * Loads the ExoClick ad provider once per document (deduped by `id`), only when ads are
 * enabled, age-verified, and zone + script URL are configured.
 */
export function ExoClickScript({ ageVerified }: Props) {
  const adsConfig = useAdsPublicConfig();
  const live = ageVerified && exoclickLiveReadyFromConfig(adsConfig);
  const src = live ? adsConfig.adScriptUrl : undefined;

  useEffect(() => {
    if (!live || !src) return;
    if (document.querySelector(exoclickScriptSelector(src))) {
      pushExoClickServe();
    }
  }, [live, src]);

  if (!live || !src) {
    return null;
  }

  return (
    <Script
      id="exoclick-ad-provider"
      src={src}
      strategy="afterInteractive"
      async
      onLoad={() => pushExoClickServe()}
    />
  );
}
