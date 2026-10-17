import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { listings } from "@/db/schema";
import { recordEvent } from "@/lib/analytics";
import { shouldRecordOutboundClick } from "@/lib/analytics-quality";
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
    const sessionId = ageCookie ?? "anon";
    const siteHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

    if (
      shouldRecordOutboundClick({
        requestUrl: request.url,
        siteHost,
        referrer,
        ageVerified: ageCookie === "1",
      })
    ) {
      await recordEvent({
        eventType: "outbound_click",
        listingId: row.id,
        path: `/go/${listingId}`,
        referrer: referrer ?? undefined,
        sessionId,
        metadata: { linkKind },
      });
    }

    return NextResponse.redirect(url, 302);
  } catch (err) {
    console.error("[go] redirect failed:", err);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
