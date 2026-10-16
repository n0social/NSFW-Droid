"use client";

import { useEffect } from "react";
import Script from "next/script";
import {
  exoclickAdScriptUrl,
  exoclickLiveReady,
  pushExoClickServe,
} from "@/lib/ads-config";

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
  const live = ageVerified && exoclickLiveReady();
  const src = live ? exoclickAdScriptUrl() : undefined;

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
