import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { listings } from "@/db/schema";
import { recordEvent } from "@/lib/analytics";
import { shouldRecordOutboundClick } from "@/lib/analytics-quality";
import {
  ANALYTICS_SESSION_COOKIE,
  analyticsSessionIdFromCookie,
  attachAnalyticsSession,
  createAnalyticsSessionId,
} from "@/lib/analytics-session";
import { AGE_VERIFIED_COOKIE } from "@/lib/cookies";
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
    const ageVerified = ageCookie === "1";
    const record = shouldRecordOutboundClick({
      requestUrl: request.url,
      siteHost,
      referrer,
      ageVerified,
    });

    const redirect = NextResponse.redirect(url, 302);
    if (!record) return redirect;

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
    return attachAnalyticsSession(redirect, sessionId, Boolean(existing));
  } catch (err) {
    console.error("[go] redirect failed:", err);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
