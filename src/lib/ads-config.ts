export type { AdsPublicConfig } from "@/lib/ads-public-config";
export {
  adsPublicConfigFromEnv,
  exoclickLiveReadyFromConfig,
  exoclickPopunderLiveReadyFromConfig,
  exoclickPopunderScriptSrcFromConfig,
  popunderZoneIdFromConfig,
  shouldShowFooterAdsFromConfig,
  shouldShowPlayPopunderFromConfig,
  zoneIdForPlacementFromConfig,
} from "@/lib/ads-public-config";

export type AdPlacement = "footer-banner";

/** Build-time fallback when no AdsConfigProvider (tests, stale client bundles). */
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

/** @deprecated Prefer shouldShowFooterAdsFromConfig + runtime config from layout. */
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

export function exoclickAdScriptUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_EXOCLICK_AD_SCRIPT_URL?.trim();
  return url || undefined;
}

export function exoclickInsClass(): string | undefined {
  const c = process.env.NEXT_PUBLIC_EXOCLICK_INS_CLASS?.trim();
  return c || undefined;
}

export function zoneIdForPlacement(placement: AdPlacement): string | undefined {
  if (placement === "footer-banner") return exoclickBannerZoneId();
  return undefined;
}

export function exoclickLiveReady(): boolean {
  if (!isAdsEnabled()) return false;
  const script = exoclickAdScriptUrl();
  const banner = exoclickBannerZoneId();
  return Boolean(script && banner);
}

export function exoclickPopunderZoneId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER?.trim();
  return id || undefined;
}

export function exoclickPopunderZoneIdMobile(): string | undefined {
  const id = process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER_MOBILE?.trim();
  return id || undefined;
}

export function exoclickPopunderScriptSrc(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_EXOCLICK_POPUNDER_SCRIPT_SRC?.trim();
  if (raw) return raw;
  if (exoclickPopunderZoneId() || exoclickPopunderZoneIdMobile()) return "/exoclick-popunder.js";
  return undefined;
}

export function exoclickPopunderLiveReady(): boolean {
  if (!isAdsEnabled()) return false;
  const hasZone = exoclickPopunderZoneId() || exoclickPopunderZoneIdMobile();
  return Boolean(hasZone && exoclickPopunderScriptSrc());
}

export function exoclickPopunderFrequencyMinutes(): number {
  const raw = process.env.NEXT_PUBLIC_EXOCLICK_POPUNDER_FREQUENCY_MINUTES?.trim();
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 0;
  return Math.min(n, 24 * 60);
}

/** @deprecated Prefer shouldShowPlayPopunderFromConfig + runtime config from layout. */
export function shouldShowPlayPopunder(ageVerified: boolean): boolean {
  if (!exoclickPopunderLiveReady()) return false;
  if (!ageVerified) return false;
  if (hasAdFreeSubscription()) return false;
  return true;
}

type ExoClickWindow = Window & {
  AdProvider?: Array<{ serve?: Record<string, never> }>;
};

export function pushExoClickServe(): void {
  if (typeof window === "undefined") return;
  const w = window as ExoClickWindow;
  w.AdProvider = w.AdProvider || [];
  w.AdProvider.push({ serve: {} });
}