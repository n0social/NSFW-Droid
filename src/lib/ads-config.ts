export type AdPlacement = "footer-banner";

/** Build-time flag — Next inlines NEXT_PUBLIC_* at compile time. */
export function isAdsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADS_ENABLED === "1";
}

/**
 * Future: return true when the signed-in user has an active ad-free subscription
 * (e.g. Stripe / supporter tier). Wire from session or profile when billing ships.
 */
export function hasAdFreeSubscription(): boolean {
  return false;
}

/** Footer ExoClick banner: enabled flag, age gate, zone config, and no ad-free plan. */
export function shouldShowFooterAds(ageVerified: boolean): boolean {
  if (!isAdsEnabled()) return false;
  if (!ageVerified) return false;
  if (hasAdFreeSubscription()) return false;
  return true;
}

export function exoclickBannerZoneId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_BANNER?.trim();
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
  if (placement === "footer-banner") return exoclickBannerZoneId();
  return undefined;
}

/** True when ads are on and we have enough config to load the network script. */
export function exoclickLiveReady(): boolean {
  if (!isAdsEnabled()) return false;
  const script = exoclickAdScriptUrl();
  const banner = exoclickBannerZoneId();
  return Boolean(script && banner);
}

/** Numeric popunder zone id (`idzone` in ExoClick popunder adConfig). */
export function exoclickPopunderZoneId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER?.trim();
  return id || undefined;
}

/**
 * Path or absolute URL to the popunder loader (paste dashboard snippet into
 * `public/exoclick-popunder.js` on the droplet, or host elsewhere).
 */
export function exoclickPopunderScriptSrc(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_EXOCLICK_POPUNDER_SCRIPT_SRC?.trim();
  if (raw) return raw;
  if (exoclickPopunderZoneId()) return "/exoclick-popunder.js";
  return undefined;
}

export function exoclickPopunderLiveReady(): boolean {
  if (!isAdsEnabled()) return false;
  return Boolean(exoclickPopunderZoneId() && exoclickPopunderScriptSrc());
}

/** Play-click popunder: same gates as footer ads (age + no ad-free tier). */
export function shouldShowPlayPopunder(ageVerified: boolean): boolean {
  if (!exoclickPopunderLiveReady()) return false;
  if (!ageVerified) return false;
  if (hasAdFreeSubscription()) return false;
  return true;
}

type ExoClickWindow = Window & {
  AdProvider?: Array<{ serve?: Record<string, never> }>;
};

/**
 * Queue `{"serve":{}}` for ad-provider.js. Call after each footer `<ins>` mount
 * (client navigations add new zones; one serve per session is not enough).
 */
export function pushExoClickServe(): void {
  if (typeof window === "undefined") return;
  const w = window as ExoClickWindow;
  w.AdProvider = w.AdProvider || [];
  w.AdProvider.push({ serve: {} });
}
