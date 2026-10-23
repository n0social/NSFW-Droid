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

/** JSON: resolved ExoClick advertiser URL for client `window.open` (no syndication hop in popups). */
export async function GET(request: Request) {
  if (!isAdsEnabled()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const jar = await cookies();
  if (!parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const zoneId = popunderZoneIdForUserAgent(request.headers.get("user-agent"));
  if (!zoneId) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const url = new URL(request.url);
  const pageUrl = url.searchParams.get("p")?.trim() || EXOCLICK_POPUNDER_REFERRER_HOME;
  const syndicationUrl = buildExoclickPopunderClickUrl(zoneId, pageUrl);
  const destination = await resolveExoclickPopunderDestination(
    syndicationUrl,
    request.headers.get("user-agent"),
  );

  if (!destination) {
    return NextResponse.json({ ok: false }, { status: 204 });
  }

  const response = NextResponse.json({ ok: true, url: destination });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}
