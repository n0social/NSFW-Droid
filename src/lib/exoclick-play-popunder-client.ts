/**
 * Client-side play-click popunder (ExoClick syndication). Works on SPA navigations;
 * does not rely on ExoClick binding all `<a>` tags at window.load.
 */

import {
  EXOCLICK_POPUNDER_DESTINATION_PATH,
  EXOCLICK_POPUNDER_REFERRER_HOME,
  isGameStorePopunderDestination,
  popunderZoneIdForUserAgent,
} from "@/lib/exoclick-popunder-syndication";

export { EXOCLICK_POPUNDER_REFERRER_HOME } from "@/lib/exoclick-popunder-syndication";

/** Matches ExoClick zone frequency_period (minutes) in public/exoclick-popunder.js */
const FREQUENCY_PERIOD_MINUTES = 60;

function popunderZoneIdForDevice(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  return popunderZoneIdForUserAgent(navigator.userAgent);
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

type PopunderOpenOptions = {
  /** Page URL sent to ExoClick as `p` (tracking). Defaults to site home for play clicks. */
  adReferrerPage?: string;
  /** Prefetched advertiser URL from {@link prefetchPopunderAdUrl}. */
  prefetchedAdUrl?: string | null;
};

function buildPopunderDestinationRequestUrl(adReferrerPage?: string): string {
  const launchUrl = new URL(EXOCLICK_POPUNDER_DESTINATION_PATH, window.location.origin);
  launchUrl.searchParams.set(
    "p",
    adReferrerPage?.trim() || EXOCLICK_POPUNDER_REFERRER_HOME,
  );
  launchUrl.searchParams.set("cb", String(Math.floor(Math.random() * 1e9)));
  return launchUrl.toString();
}

/** Resolve advertiser URL server-side (credentials send age cookie). */
export async function prefetchPopunderAdUrl(
  adReferrerPage?: string,
): Promise<string | null> {
  const zoneId = popunderZoneIdForDevice();
  if (!zoneId || withinCapping(zoneId)) return null;

  try {
    const res = await fetch(buildPopunderDestinationRequestUrl(adReferrerPage), {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; url?: string };
    const url = data.url?.trim() ?? "";
    if (!data.ok || !url.startsWith("http") || isGameStorePopunderDestination(url)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

/** Open a resolved advertiser URL in a background tab (never syndication or `/api/go`). */
function openResolvedAdTab(adUrl: string): Window | null {
  const zoneId = popunderZoneIdForDevice();
  if (!zoneId || withinCapping(zoneId)) return null;
  if (!adUrl.startsWith("http") || isGameStorePopunderDestination(adUrl)) return null;

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
export function firePlayStorePopunder(
  goHref: string,
  options?: Pick<PopunderOpenOptions, "prefetchedAdUrl">,
): boolean {
  return firePopunderThenOpenNewTab(goHref, {
    adReferrerPage: EXOCLICK_POPUNDER_REFERRER_HOME,
    prefetchedAdUrl: options?.prefetchedAdUrl,
  });
}

/**
 * Keep this tab on NSFW Droid: open store/content in a focused new tab, then popunder ad
 * (best effort). Uses a prefetched advertiser URL so we never open ExoClick syndication in
 * a popup (that path was opening a second store tab).
 */
export function firePopunderThenOpenNewTab(
  destHref: string,
  options?: PopunderOpenOptions,
): boolean {
  if (!destHref) return false;
  const destWin = window.open(destHref, "_blank", "noopener,noreferrer");
  if (!destWin) return false;

  const adUrl = options?.prefetchedAdUrl;
  if (adUrl) {
    openResolvedAdTab(adUrl);
  }

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
