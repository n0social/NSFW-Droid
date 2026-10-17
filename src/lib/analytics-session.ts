import { randomBytes } from "crypto";
import type { NextResponse } from "next/server";

/** Per-browser id. The age-gate cookie is "1" for everyone and cannot do this job. */
export const ANALYTICS_SESSION_COOKIE = "analytics_sid";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_ID_RE = /^[a-f0-9]{32}$/;

export function analyticsSessionIdFromCookie(value: string | undefined): string | null {
  if (!value || !SESSION_ID_RE.test(value)) return null;
  return value;
}

export function createAnalyticsSessionId(): string {
  return randomBytes(16).toString("hex");
}

export function attachAnalyticsSession(
  response: NextResponse,
  sessionId: string,
  alreadyStored: boolean,
): NextResponse {
  if (!alreadyStored) {
    response.cookies.set(ANALYTICS_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });
  }
  return response;
}
