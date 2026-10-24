import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/analytics";
import {
  analyticsSessionIdFromCookie,
  attachAnalyticsSession,
  createAnalyticsSessionId,
  ANALYTICS_SESSION_COOKIE,
} from "@/lib/analytics-session";
import { rejectCrossSitePublicPost } from "@/lib/public-post-csrf";
import { rateLimitExceededResponse } from "@/lib/rate-limit";
import { isInternalAnalyticsRequest, shouldSkipAnalyticsRecording } from "@/lib/analytics-quality";
import { isAdminSession } from "@/lib/admin-auth";
import { AGE_VERIFIED_COOKIE } from "@/lib/cookies";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const csrf = rejectCrossSitePublicPost(request);
  if (csrf) return csrf;

  if (!isInternalAnalyticsRequest(request.headers)) {
    const limited = rateLimitExceededResponse(request, "analytics-view", 120, 60 * 1000);
    if (limited) return limited;
  }

  const body = await request.json().catch(() => ({}));
  const jar = await cookies();
  if (jar.get(AGE_VERIFIED_COOKIE)?.value !== "1") {
    return NextResponse.json({ ok: true, recorded: false });
  }
  if (
    shouldSkipAnalyticsRecording({
      userAgent: request.headers.get("user-agent"),
      internalRequest: isInternalAnalyticsRequest(request.headers),
      adminSession: await isAdminSession(),
    })
  ) {
    return NextResponse.json({ ok: true, recorded: false });
  }

  const existing = analyticsSessionIdFromCookie(jar.get(ANALYTICS_SESSION_COOKIE)?.value);
  const sessionId = existing ?? createAnalyticsSessionId();

  await recordEvent({
    eventType: body.listing_id ? "listing_view" : "page_view",
    listingId: body.listing_id ? String(body.listing_id) : undefined,
    path: body.path ? String(body.path) : undefined,
    sessionId,
  });

  const res = NextResponse.json({ ok: true, recorded: true });
  return attachAnalyticsSession(res, sessionId, Boolean(existing));
}
