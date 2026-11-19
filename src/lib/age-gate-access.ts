import { ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";
import { AGE_VERIFIED_COOKIE, parseAgeVerified } from "@/lib/cookies";
import { verifySignedSessionValue } from "@/lib/session-cookie";
import { USER_SESSION_COOKIE } from "@/lib/user-session";

/** Document path the gate page is served from. Middleware must not rewrite this path. */
export const AGE_WALL_PATH = "/age-wall";

/**
 * Search crawlers that need the public HTML for indexing. A normal browser
 * spoofing this string can skip the wall; the in-house gate is not a vendor
 * age check. Visitors are still blocked.
 */
const SEARCH_CRAWLER_UA =
  /Googlebot|Google-InspectionTool|bingbot|DuckDuckBot|Applebot|Slurp|Baiduspider|YandexBot/i;

const EXACT_EXEMPT = new Set([
  AGE_WALL_PATH,
  "/underage",
  "/terms",
  "/privacy",
  "/dmca",
  "/affiliate",
  "/newsletter",
  "/api/age-gate",
  "/api/health",
  "/api/newsletter/confirm",
  "/api/newsletter/unsubscribe",
]);

export function isSearchCrawlerUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent?.trim()) return false;
  return SEARCH_CRAWLER_UA.test(userAgent);
}

export function pathnameSkipsAgeWall(pathname: string): boolean {
  if (EXACT_EXEMPT.has(pathname)) return true;
  if (pathname.startsWith("/api/newsletter/confirm")) return true;
  if (pathname.startsWith("/api/newsletter/unsubscribe")) return true;
  return false;
}

export function requestPassesInHouseAgeGate(input: {
  ageVerifiedCookie: string | undefined;
  userSessionCookie: string | undefined;
  adminSessionCookie: string | undefined;
  userAgent?: string | null;
}): boolean {
  if (parseAgeVerified(input.ageVerifiedCookie)) return true;
  if (verifySignedSessionValue(input.userSessionCookie)) return true;
  if (verifyAdminSessionToken(input.adminSessionCookie ?? "")) return true;
  if (isSearchCrawlerUserAgent(input.userAgent)) return true;
  return false;
}

export type AgeWallAction = "allow" | "rewrite" | "deny-api";

export function ageWallAction(input: {
  pathname: string;
  onAdminHost: boolean;
  ageVerifiedCookie: string | undefined;
  userSessionCookie: string | undefined;
  adminSessionCookie: string | undefined;
  userAgent?: string | null;
}): AgeWallAction {
  if (input.onAdminHost) return "allow";
  if (pathnameSkipsAgeWall(input.pathname)) return "allow";
  if (
    requestPassesInHouseAgeGate({
      ageVerifiedCookie: input.ageVerifiedCookie,
      userSessionCookie: input.userSessionCookie,
      adminSessionCookie: input.adminSessionCookie,
      userAgent: input.userAgent,
    })
  ) {
    return "allow";
  }
  if (input.pathname.startsWith("/api/")) return "deny-api";
  return "rewrite";
}

export const ageWallCookieNames = {
  age: AGE_VERIFIED_COOKIE,
  user: USER_SESSION_COOKIE,
  admin: ADMIN_COOKIE,
} as const;
