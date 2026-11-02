/**
 * Client-side play-click popunder (ExoClick syndication). Works on SPA navigations;
 * does not rely on ExoClick binding all `<a>` tags at window.load.
 *
 * Eligible clicks do two things:
 * 1. A hidden iframe loads `/api/ads/popunder-launch?hop=syndication`, which 302s
 *    that iframe to `s.pemsrv.com/v1/link.php`. ExoClick counts that browser navigation.
 * 2. The current tab navigates to `/api/go` or the outbound URL (one store navigation).
 *
 * link.php may itself call `window.open`. This client does not also open the store,
 * so the catalog does not add a second tab.
 * A server-side `fetch` of `s.pemsrv.com` does not bill.
 */

import { exoclickPopunderFrequencyMinutes } from "@/lib/ads-config";
import {
  EXOCLICK_POPUNDER_LAUNCH_PATH,
  EXOCLICK_POPUNDER_REFERRER_HOME,
  popunderZoneIdForUserAgent,
} from "@/lib/exoclick-popunder-syndication";

export { EXOCLICK_POPUNDER_REFERRER_HOME } from "@/lib/exoclick-popunder-syndication";

const HIDDEN_FRAME_CLEANUP_MS = 120_000;
/**
 * If the iframe never finishes (blocked network), still send the visitor to the store.
 * Navigating immediately cancels the iframe, so the hop must start first.
 */
const HOP_SETTLE_FALLBACK_MS = 1_200;

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
 * True once the hidden iframe has left our launch URL. A thrown location read means
 * the frame followed the 302 onto `s.pemsrv.com` (cross-origin).
 */
function iframeHopReachedAdvertiser(iframe: HTMLIFrameElement): boolean {
  try {
    const href = iframe.contentWindow?.location?.href ?? "";
    if (!href || href === "about:blank") return false;
    if (href.includes(EXOCLICK_POPUNDER_LAUNCH_PATH)) return false;
    return true;
  } catch {
    return true;
  }
}

/**
 * Load popunder through same-origin launch → ExoClick `link.php` inside a hidden iframe
 * (browser navigation, not a Node `fetch`). Calls `onReadyToLeave` once that document
 * request has landed, or after a short fallback, so the current tab can go to the store
 * without aborting the hop. A server-only resolve does not bill.
 */
function armHiddenPopunderFrame(
  options: PopunderOpenOptions | undefined,
  onReadyToLeave: () => void,
): void {
  const zoneId = popunderZoneIdForDevice();
  if (!zoneId || withinCapping(zoneId) || typeof document === "undefined" || !document.body) {
    onReadyToLeave();
    return;
  }

  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    onReadyToLeave();
  };

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.title = "";
  iframe.style.cssText =
    "position:absolute;width:0;height:0;border:0;clip:rect(0,0,0,0);overflow:hidden";
  iframe.addEventListener("load", () => {
    if (iframeHopReachedAdvertiser(iframe)) settle();
  });
  iframe.addEventListener("error", settle);
  iframe.src = buildPopunderLaunchUrl(options?.adReferrerPage);
  document.body.appendChild(iframe);

  if (exoclickPopunderFrequencyMinutes() >= 1) {
    markOpened(zoneId);
  }

  window.setTimeout(() => {
    iframe.remove();
  }, HIDDEN_FRAME_CLEANUP_MS);
  window.setTimeout(settle, HOP_SETTLE_FALLBACK_MS);
}

function navigateCurrentTab(destHref: string): void {
  window.location.assign(destHref);
}

/**
 * Hidden iframe requests ExoClick, then the current tab navigates to `destHref`.
 * Does not call `window.open` for the store or the ad.
 */
export function firePopunderThenNavigate(
  destHref: string,
  options?: PopunderOpenOptions,
): boolean {
  if (!destHref) return false;
  armHiddenPopunderFrame(options, () => navigateCurrentTab(destHref));
  return true;
}

/** @deprecated Use {@link firePlayStorePopunder}. Navigates the current tab. */
export function firePlayPopunderThenNavigate(goHref: string): boolean {
  return firePlayStorePopunder(goHref);
}

/**
 * Play on store: current tab goes to `/api/go/…` (then the store). ExoClick `link.php`
 * loads in a hidden iframe. No second `window.open` for the store.
 */
export function firePlayStorePopunder(goHref: string): boolean {
  return firePopunderThenNavigate(goHref, {
    adReferrerPage: EXOCLICK_POPUNDER_REFERRER_HOME,
  });
}
