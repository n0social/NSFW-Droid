/**
 * Client-side play-click popunder (ExoClick syndication). Works on SPA navigations;
 * does not rely on ExoClick binding all `<a>` tags at window.load.
 */

import { exoclickPopunderFrequencyMinutes } from "@/lib/ads-config";
import {
  EXOCLICK_POPUNDER_LAUNCH_PATH,
  EXOCLICK_POPUNDER_REFERRER_HOME,
  popunderZoneIdForUserAgent,
} from "@/lib/exoclick-popunder-syndication";

export { EXOCLICK_POPUNDER_REFERRER_HOME } from "@/lib/exoclick-popunder-syndication";

const HIDDEN_FRAME_CLEANUP_MS = 120_000;

function popunderZoneIdForDevice(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  return popunderZoneIdForUserAgent(navigator.userAgent);
}

function capStorageKey(zoneId: string): string {
  return `nsfwdroid-exo-pop-${zoneId}`;
}

function withinCapping(zoneId: string): boolean {
  const periodMin = exoclickPopunderFrequencyMinutes();
  if (periodMin < 1) return false;
  try {
    const raw = localStorage.getItem(capStorageKey(zoneId));
    if (!raw) return false;
    const last = Number(raw);
    if (!Number.isFinite(last)) return false;
    return Date.now() - last < periodMin * 60 * 1000;
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
};

function buildPopunderLaunchUrl(adReferrerPage?: string): string {
  const launchUrl = new URL(EXOCLICK_POPUNDER_LAUNCH_PATH, window.location.origin);
  launchUrl.searchParams.set(
    "p",
    adReferrerPage?.trim() || EXOCLICK_POPUNDER_REFERRER_HOME,
  );
  launchUrl.searchParams.set("cb", String(Math.floor(Math.random() * 1e9)));
  launchUrl.searchParams.set("hop", "syndication");
  return launchUrl.toString();
}

/**
 * Load popunder through same-origin launch → server-resolved advertiser redirect inside a
 * hidden iframe (not a visible tab). Iframe hits `/api/ads/popunder-launch?hop=syndication`
 * so the **browser** requests ExoClick `link.php` (required for zone stats / pay).
 * The user only sees one new tab (the store / outbound destination).
 */
function openPopunderAdInHiddenFrame(options?: PopunderOpenOptions): void {
  const zoneId = popunderZoneIdForDevice();
  if (!zoneId || withinCapping(zoneId)) return;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.title = "";
  iframe.src = buildPopunderLaunchUrl(options?.adReferrerPage);
  iframe.style.cssText =
    "position:absolute;width:0;height:0;border:0;clip:rect(0,0,0,0);overflow:hidden";

  document.body.appendChild(iframe);
  if (exoclickPopunderFrequencyMinutes() >= 1) {
    markOpened(zoneId);
  }

  window.setTimeout(() => {
    iframe.remove();
  }, HIDDEN_FRAME_CLEANUP_MS);
}

/**
 * @deprecated Use {@link firePopunderThenOpenNewTab}; never navigates the current tab.
 */
export function firePlayPopunderThenNavigate(goHref: string): boolean {
  return firePlayStorePopunder(goHref);
}

/** Play on store: one visible `/api/go/` tab; ad loads in a hidden iframe. */
export function firePlayStorePopunder(goHref: string): boolean {
  return firePopunderThenOpenNewTab(goHref, {
    adReferrerPage: EXOCLICK_POPUNDER_REFERRER_HOME,
  });
}

/**
 * Stay on NSFW Droid: open exactly one new tab for the destination (synchronous, user
 * gesture), then fire the popunder hop in a hidden iframe.
 */
export function firePopunderThenOpenNewTab(
  destHref: string,
  options?: PopunderOpenOptions,
): boolean {
  if (!destHref) return false;

  const destWin = window.open(destHref, "_blank", "noopener,noreferrer");
  if (!destWin) return false;

  openPopunderAdInHiddenFrame(options);

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
