import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdsEnabled } from "@/lib/ads-config";
import {
  buildExoclickPopunderClickUrl,
  EXOCLICK_POPUNDER_REFERRER_HOME,
  popunderZoneIdForUserAgent,
  resolveExoclickPopunderDestination,
} from "@/lib/exoclick-popunder-syndication";
import { AGE_VERIFIED_COOKIE, parseAgeVerified } from "@/lib/cookies";

/**
 * Neutral hop before ExoClick syndication so the ad tab does not send the game
 * listing as Referer (which was opening a second store tab instead of an ad).
 */
export async function GET(request: Request) {
  if (!isAdsEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const jar = await cookies();
  if (!parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value)) {
    return new NextResponse(null, { status: 403 });
  }

  const zoneId = popunderZoneIdForUserAgent(request.headers.get("user-agent"));
  if (!zoneId) {
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(request.url);
  const pageUrl = url.searchParams.get("p")?.trim() || EXOCLICK_POPUNDER_REFERRER_HOME;
  const syndicationUrl = buildExoclickPopunderClickUrl(zoneId, pageUrl);
  const hop = url.searchParams.get("hop")?.trim().toLowerCase();

  /**
   * `hop=syndication` (default for Play iframe): browser must request ExoClick link.php
   * so the zone records the impression. Server-only resolve does not monetize.
   */
  if (hop === "syndication" || hop === "exo") {
    const response = NextResponse.redirect(syndicationUrl, 302);
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  const destination = await resolveExoclickPopunderDestination(
    syndicationUrl,
    request.headers.get("user-agent"),
  );

  if (!destination) {
    return new NextResponse(null, { status: 204 });
  }

  const response = NextResponse.redirect(destination, 302);
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}
