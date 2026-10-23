import {
  buildExoclickPopunderClickUrl,
  EXOCLICK_POPUNDER_REFERRER_HOME,
  popunderZoneIdForUserAgent,
} from "@/lib/exoclick-popunder-syndication";

/** Fire-and-forget syndication request (no browser tab / no window.open). */
export function scheduleExoclickPopunderSyndicationHit(
  userAgent: string | null | undefined,
  pageUrl: string = EXOCLICK_POPUNDER_REFERRER_HOME,
): void {
  const zoneId = popunderZoneIdForUserAgent(userAgent);
  if (!zoneId) return;
  const syndicationUrl = buildExoclickPopunderClickUrl(zoneId, pageUrl);
  void fetch(syndicationUrl, { redirect: "follow" }).catch(() => {});
}
