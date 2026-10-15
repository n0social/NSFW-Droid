export type AdPlacement = "below-hero" | "between-rails" | "browse-inline";

/** Build-time flag — Next inlines NEXT_PUBLIC_* at compile time. */
export function isAdsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADS_ENABLED === "1";
}

export function exoclickBannerZoneId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_BANNER?.trim();
  return id || undefined;
}

export function exoclickNativeZoneId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_NATIVE?.trim();
  return id || undefined;
}

/** Publisher ad tag from ExoClick zone setup (e.g. https://a.magsrv.com/ad-provider.js). */
export function exoclickAdScriptUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_EXOCLICK_AD_SCRIPT_URL?.trim();
  return url || undefined;
}

/** Optional `class` on `<ins>` from the zone snippet in the ExoClick dashboard. */
export function exoclickInsClass(): string | undefined {
  const c = process.env.NEXT_PUBLIC_EXOCLICK_INS_CLASS?.trim();
  return c || undefined;
}

export function zoneIdForPlacement(placement: AdPlacement): string | undefined {
  if (placement === "browse-inline") return exoclickNativeZoneId();
  return exoclickBannerZoneId();
}

/** True when ads are on and we have enough config to load the network script. */
export function exoclickLiveReady(): boolean {
  if (!isAdsEnabled()) return false;
  const script = exoclickAdScriptUrl();
  const banner = exoclickBannerZoneId();
  const native = exoclickNativeZoneId();
  return Boolean(script && (banner || native));
}
