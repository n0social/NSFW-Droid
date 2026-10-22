/**
 * Client-side play-click popunder (ExoClick syndication). Works on SPA navigations;
 * does not rely on ExoClick binding all `<a>` tags at window.load.
 */

const SYNDICATION_HOST = "s.pemsrv.com";
/** Avoid passing game/listing URLs as `p=` — ExoClick can open a second store tab. */
export const EXOCLICK_POPUNDER_REFERRER_HOME = "https://www.nsfwdroid.com/";
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

type PopunderOpenOptions = {
  /** Page URL sent to ExoClick as `p` (tracking). Defaults to current page. */
  adReferrerPage?: string;
};

/** Open syndication popunder in a background tab; returns null when blocked or capped. */
function openPopunderAdWindow(options?: PopunderOpenOptions): Window | null {
  const zoneId = popunderZoneIdForDevice();
  if (!zoneId) return null;
  if (withinCapping(zoneId)) return null;

  const pageUrl =
    options?.adReferrerPage?.trim() ||
    (typeof window !== "undefined" ? window.location.href : "");
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
 * @deprecated Use {@link firePopunderThenOpenNewTab}; never navigates the current tab.
 */
export function firePlayPopunderThenNavigate(goHref: string): boolean {
  return firePlayStorePopunder(goHref);
}

/** Play on store: one `/api/go/` tab + ad tab; ad `p=` is site home (not the listing page). */
export function firePlayStorePopunder(goHref: string): boolean {
  return firePopunderThenOpenNewTab(goHref, {
    adReferrerPage: EXOCLICK_POPUNDER_REFERRER_HOME,
  });
}

/**
 * Keep this tab on NSFW Droid: open store/content in a focused new tab, then popunder ad
 * (best effort). Destination opens first so popup blockers prioritize the real link.
 */
export function firePopunderThenOpenNewTab(
  destHref: string,
  options?: PopunderOpenOptions,
): boolean {
  if (!destHref) return false;
  const destWin = window.open(destHref, "_blank", "noopener,noreferrer");
  if (!destWin) return false;

  openPopunderAdWindow(options);

  try {
    destWin.focus();
  } catch {
    /* noop */
  }
  try {
    window.focus();
  } catch {
    /* noop */
  }
  return true;
}

/** Open `/api/go/…` or external URL in a new tab without popunder (same-tab never). */
export function openOutboundInNewTab(destHref: string): boolean {
  if (!destHref) return false;
  const destWin = window.open(destHref, "_blank", "noopener,noreferrer");
  if (!destWin) return false;
  try {
    destWin.focus();
  } catch {
    /* noop */
  }
  return true;
}
