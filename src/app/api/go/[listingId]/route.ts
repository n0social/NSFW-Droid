import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { listings } from "@/db/schema";
import { recordEvent } from "@/lib/analytics";
import {
  isInternalAnalyticsRequest,
  shouldRecordOutboundClick,
} from "@/lib/analytics-quality";
import { isAdminSession } from "@/lib/admin-auth";
import {
  ANALYTICS_SESSION_COOKIE,
  analyticsSessionIdFromCookie,
  attachAnalyticsSession,
  createAnalyticsSessionId,
} from "@/lib/analytics-session";
import { AGE_VERIFIED_COOKIE, parseAgeVerified } from "@/lib/cookies";
import {
  buildMonetizedRedirectInterstitialHtml,
  buildPopunderLaunchUrlForRequest,
  shouldServeExoclickRedirectInterstitial,
} from "@/lib/exoclick-go-interstitial";
import { isValidOutboundUrl, resolveOutboundLink } from "@/lib/outbound-link";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await context.params;
  try {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);
    if (!row) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const { url, linkKind } = resolveOutboundLink(row);
    if (!isValidOutboundUrl(url)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const jar = await cookies();
    const ageCookie = jar.get(AGE_VERIFIED_COOKIE)?.value;
    const referrer = request.headers.get("referer");
    const siteHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const ageVerified = parseAgeVerified(ageCookie);
    const record = shouldRecordOutboundClick({
      requestUrl: request.url,
      siteHost,
      referrer,
      ageVerified,
      userAgent: request.headers.get("user-agent"),
      internalRequest: isInternalAnalyticsRequest(request.headers),
      adminSession: await isAdminSession(),
    });

    const useInterstitial = shouldServeExoclickRedirectInterstitial(ageVerified, row);

    if (record) {
      const existing = analyticsSessionIdFromCookie(jar.get(ANALYTICS_SESSION_COOKIE)?.value);
      const sessionId = existing ?? createAnalyticsSessionId();
      await recordEvent({
        eventType: "outbound_click",
        listingId: row.id,
        path: `/go/${listingId}`,
        referrer: referrer ?? undefined,
        sessionId,
        metadata: { linkKind },
      });

      if (useInterstitial) {
        const launch = buildPopunderLaunchUrlForRequest(request.url);
        const html = buildMonetizedRedirectInterstitialHtml(url, launch);
        const interstitial = new NextResponse(html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Referrer-Policy": "no-referrer",
            "X-Robots-Tag": "noindex, nofollow, noarchive",
            "Cache-Control": "private, no-store",
          },
        });
        return attachAnalyticsSession(interstitial, sessionId, Boolean(existing));
      }

      const redirect = NextResponse.redirect(url, 302);
      return attachAnalyticsSession(redirect, sessionId, Boolean(existing));
    }

    if (useInterstitial) {
      const launch = buildPopunderLaunchUrlForRequest(request.url);
      const html = buildMonetizedRedirectInterstitialHtml(url, launch);
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Referrer-Policy": "no-referrer",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
          "Cache-Control": "private, no-store",
        },
      });
    }

    return NextResponse.redirect(url, 302);
  } catch (err) {
    console.error("[go] redirect failed:", err);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
