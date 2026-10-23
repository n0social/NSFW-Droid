import { NextResponse } from "next/server";
import { isValidOutboundUrl } from "@/lib/outbound-link";
import {
  buildMonetizedRedirectInterstitialHtml,
  buildPopunderLaunchUrlForRequest,
  shouldServeExoclickRedirectInterstitial,
} from "@/lib/exoclick-go-interstitial";
import { AGE_VERIFIED_COOKIE, parseAgeVerified } from "@/lib/cookies";
import { cookies } from "next/headers";

/** Same-tab external outbound with optional ExoClick interstitial (videos, creators, etc.). */
export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const raw = reqUrl.searchParams.get("u")?.trim() ?? "";
  if (!raw || !isValidOutboundUrl(raw)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const jar = await cookies();
  const ageVerified = parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value);

  if (shouldServeExoclickRedirectInterstitial(ageVerified, undefined, raw)) {
    const launch = buildPopunderLaunchUrlForRequest(request.url);
    const html = buildMonetizedRedirectInterstitialHtml(raw, launch);
    const response = new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "Cache-Control": "private, no-store",
      },
    });
    return response;
  }

  const response = NextResponse.redirect(raw, 302);
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
