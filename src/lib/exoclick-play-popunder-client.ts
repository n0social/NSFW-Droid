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

/**
 * Open ExoClick popunder in a new tab on the same user gesture; does not block navigation.
 */
export function firePlayPopunderIfAllowed(): void {
  const zoneId = popunderZoneIdForDevice();
  if (!zoneId) return;
  if (withinCapping(zoneId)) return;

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const adUrl = buildExoclickPopunderClickUrl(zoneId, pageUrl);
  const opened = window.open(adUrl, "_blank", "noopener,noreferrer");
  if (opened) markOpened(zoneId);
}
