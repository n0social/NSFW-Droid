/**
 * Client-side play-click popunder (ExoClick syndication). Works on SPA navigations;
 * does not rely on ExoClick binding all `<a>` tags at window.load.
 */

const SYNDICATION_HOST = "s.pemsrv.com";
/** Matches ExoClick zone frequency_period (minutes) in public/exoclick-popunder.js */
const FREQUENCY_PERIOD_MINUTES = 60;

function popunderZoneIdForDevice(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  const mobile = /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WebOS|Windows Phone/i.test(
    navigator.userAgent,
  );
  const desktop = process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER?.trim();
  const mobileZone = process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER_MOBILE?.trim();
  return mobile ? mobileZone || desktop : desktop;
}

function capStorageKey(zoneId: string): string {
  return `nsfwdroid-exo-pop-${zoneId}`;
}

function withinCapping(zoneId: string): boolean {
  try {
    const raw = localStorage.getItem(capStorageKey(zoneId));
    if (!raw) return false;
    const last = Number(raw);
    if (!Number.isFinite(last)) return false;
    return Date.now() - last < FREQUENCY_PERIOD_MINUTES * 60 * 1000;
  } catch {
    return false;
  }
}

function markOpened(zoneId: string): void {
  try {
    localStorage.setItem(capStorageKey(zoneId), String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function buildExoclickPopunderClickUrl(zoneId: string, pageUrl: string): string {
  const params = new URLSearchParams({
    idzone: zoneId,
    type: "8",
    p: pageUrl,
    sub: "",
    block: "1",
    gdpr: "0",
    cookieconsent: "true",
    cb: String(Math.floor(Math.random() * 1e9)),
  });
  return `https://${SYNDICATION_HOST}/v1/link.php?${params.toString()}`;
}

/** Open syndication popunder in a background tab; returns null when blocked or capped. */
function openPopunderAdWindow(): Window | null {
  const zoneId = popunderZoneIdForDevice();
  if (!zoneId) return null;
  if (withinCapping(zoneId)) return null;

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const adUrl = buildExoclickPopunderClickUrl(zoneId, pageUrl);
  const adWin = window.open(adUrl, "_blank", "noopener,noreferrer");
  if (!adWin) return null;

  markOpened(zoneId);

  try {
    adWin.blur();
  } catch {
    /* noop */
  }
  try {
    window.focus();
  } catch {
    /* noop */
  }

  return adWin;
}

/**
 * Open destination in a focused new tab with the ad behind (Play, videos, assets).
 * Same-tab `location.assign` after `window.open(ad)` often leaves the ad tab focused.
 */
export function firePlayPopunderThenNavigate(goHref: string): boolean {
  return firePopunderThenOpenNewTab(goHref);
}

/**
 * Open ad in background, destination in a focused new tab (videos, assets, etc.).
 */
export function firePopunderThenOpenNewTab(destHref: string): boolean {
  if (!destHref) return false;
  if (!openPopunderAdWindow()) return false;
  const destWin = window.open(destHref, "_blank", "noopener,noreferrer");
  if (!destWin) return false;
  try {
    destWin.focus();
  } catch {
    /* noop */
  }
  return true;
}
