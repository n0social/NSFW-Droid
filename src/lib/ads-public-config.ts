/** Runtime ExoClick / ads settings from process.env (server at request time). */

export type AdsPublicConfig = {
  enabled: boolean;
  bannerZoneId?: string;
  adScriptUrl?: string;
  insClass?: string;
  popunderDesktopZoneId?: string;
  popunderMobileZoneId?: string;
  popunderScriptSrc?: string;
  popunderFrequencyMinutes: number;
};

function trimOrUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/** Read live droplet env. Safe on server; client bundles may still see build-time NEXT_PUBLIC_* only. */
export function adsPublicConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): AdsPublicConfig {
  const popunderFrequencyRaw = env.NEXT_PUBLIC_EXOCLICK_POPUNDER_FREQUENCY_MINUTES?.trim();
  let popunderFrequencyMinutes = 0;
  if (popunderFrequencyRaw) {
    const n = Number.parseInt(popunderFrequencyRaw, 10);
    if (Number.isFinite(n) && n >= 1) popunderFrequencyMinutes = Math.min(n, 24 * 60);
  }

  const popunderDesktopZoneId = trimOrUndefined(env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER);
  const popunderMobileZoneId = trimOrUndefined(env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER_MOBILE);
  const popunderScriptSrcOverride = trimOrUndefined(env.NEXT_PUBLIC_EXOCLICK_POPUNDER_SCRIPT_SRC);
  const popunderScriptSrc =
    popunderScriptSrcOverride ||
    (popunderDesktopZoneId || popunderMobileZoneId ? "/exoclick-popunder.js" : undefined);

  return {
    enabled: env.NEXT_PUBLIC_ADS_ENABLED === "1",
    bannerZoneId: trimOrUndefined(env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_BANNER),
    adScriptUrl: trimOrUndefined(env.NEXT_PUBLIC_EXOCLICK_AD_SCRIPT_URL),
    insClass: trimOrUndefined(env.NEXT_PUBLIC_EXOCLICK_INS_CLASS),
    popunderDesktopZoneId,
    popunderMobileZoneId,
    popunderScriptSrc,
    popunderFrequencyMinutes,
  };
}

export function exoclickPopunderScriptSrcFromConfig(config: AdsPublicConfig): string | undefined {
  return config.popunderScriptSrc;
}

export function exoclickPopunderLiveReadyFromConfig(config: AdsPublicConfig): boolean {
  if (!config.enabled) return false;
  const hasZone = config.popunderDesktopZoneId || config.popunderMobileZoneId;
  return Boolean(hasZone && exoclickPopunderScriptSrcFromConfig(config));
}

export function exoclickLiveReadyFromConfig(config: AdsPublicConfig): boolean {
  if (!config.enabled) return false;
  return Boolean(config.adScriptUrl && config.bannerZoneId);
}

export function zoneIdForPlacementFromConfig(
  placement: "footer-banner",
  config: AdsPublicConfig,
): string | undefined {
  if (placement === "footer-banner") return config.bannerZoneId;
  return undefined;
}

function adFreeSubscriptionActive(): boolean {
  return false;
}

export function shouldShowPlayPopunderFromConfig(
  config: AdsPublicConfig,
  ageVerified: boolean,
): boolean {
  if (!exoclickPopunderLiveReadyFromConfig(config)) return false;
  if (!ageVerified) return false;
  if (adFreeSubscriptionActive()) return false;
  return true;
}

export function shouldShowFooterAdsFromConfig(
  config: AdsPublicConfig,
  ageVerified: boolean,
): boolean {
  if (!exoclickLiveReadyFromConfig(config)) return false;
  if (!ageVerified) return false;
  if (adFreeSubscriptionActive()) return false;
  return true;
}

const MOBILE_UA_RE =
  /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WebOS|Windows Phone/i;

export function popunderZoneIdFromConfig(
  userAgent: string | null | undefined,
  config: AdsPublicConfig,
): string | undefined {
  const mobile = userAgent ? MOBILE_UA_RE.test(userAgent) : false;
  return mobile
    ? config.popunderMobileZoneId || config.popunderDesktopZoneId
    : config.popunderDesktopZoneId;
}