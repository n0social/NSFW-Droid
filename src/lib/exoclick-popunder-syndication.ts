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
