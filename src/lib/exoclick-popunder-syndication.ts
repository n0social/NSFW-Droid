/** Shared ExoClick popunder syndication URL (client + server). */

export const EXOCLICK_SYNDICATION_HOST = "s.pemsrv.com";

export const EXOCLICK_POPUNDER_REFERRER_HOME = "https://www.nsfwdroid.com/";

export const EXOCLICK_POPUNDER_LAUNCH_PATH = "/api/ads/popunder-launch";

const MOBILE_UA_RE =
  /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WebOS|Windows Phone/i;

export function popunderZoneIdForUserAgent(userAgent: string | null | undefined): string | undefined {
  const mobile = userAgent ? MOBILE_UA_RE.test(userAgent) : false;
  const desktop = process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER?.trim();
  const mobileZone = process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER_MOBILE?.trim();
  return mobile ? mobileZone || desktop : desktop;
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
  return `https://${EXOCLICK_SYNDICATION_HOST}/v1/link.php?${params.toString()}`;
}

/** True when a resolved popunder URL is a game store, not an ad network landing page. */
export function isGameStorePopunderDestination(url: string): boolean {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase();
    if (host === "itch.io" || host.endsWith(".itch.io")) return true;
    if (host === "store.steampowered.com" || host.endsWith(".steampowered.com")) return true;
    if (host.includes("nsfwdroid.com") && u.pathname.startsWith("/api/go")) return true;
  } catch {
    return true;
  }
  return false;
}

const POPUNDER_RESOLVE_TIMEOUT_MS = 8_000;

/**
 * Follow ExoClick syndication redirects server-side so the browser tab opens the
 * advertiser directly (avoids popunder JS opening a second store tab).
 */
export async function resolveExoclickPopunderDestination(
  syndicationUrl: string,
  userAgent: string | null | undefined,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POPUNDER_RESOLVE_TIMEOUT_MS);
  try {
    const res = await fetch(syndicationUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent?.trim() || "Mozilla/5.0 (compatible; NSFW-Droid/1.0)",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });
    const final = res.url?.trim() ?? "";
    if (final.startsWith("http") && !isGameStorePopunderDestination(final)) {
      return final;
    }
  } catch {
    /* fall through */
  } finally {
    clearTimeout(timer);
  }
  return syndicationUrl;
}
