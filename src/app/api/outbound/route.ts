import { NextResponse } from "next/server";
import { shouldServeExoclickRedirectInterstitial } from "@/lib/exoclick-go-interstitial";
import { scheduleExoclickPopunderSyndicationHit } from "@/lib/exoclick-popunder-server";
import { isValidOutboundUrl } from "@/lib/outbound-link";
import { AGE_VERIFIED_COOKIE, parseAgeVerified } from "@/lib/cookies";
import { cookies } from "next/headers";

/** Same-tab external outbound (videos, creators). ExoClick on server; 302 only in browser. */
export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const raw = reqUrl.searchParams.get("u")?.trim() ?? "";
  if (!raw || !isValidOutboundUrl(raw)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const jar = await cookies();
  const ageVerified = parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value);

  if (shouldServeExoclickRedirectInterstitial(ageVerified, undefined, raw)) {
    scheduleExoclickPopunderSyndicationHit(request.headers.get("user-agent"));
  }

  const response = NextResponse.redirect(raw, 302);
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}
