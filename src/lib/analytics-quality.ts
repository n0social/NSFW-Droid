import { createHash } from "crypto";
import { and, eq, gte, sql, type SQL } from "drizzle-orm";
import { analyticsEvents } from "@/db/schema";

/**
 * Age gate sets `age_verified=1` for every visitor who taps Yes.
 * `recordEvent` stores the SHA-256 prefix of that cookie, so every
 * age-verified browser shares one session hash. It is not a person id.
 */
export const AGE_VERIFIED_COOKIE_VALUE = "1";

export const AGE_VERIFIED_SESSION_HASH = createHash("sha256")
  .update(AGE_VERIFIED_COOKIE_VALUE)
  .digest("hex")
  .slice(0, 32);

/** Public site, localhost, or the apex/www host, with a path. */
export const VISITOR_REFERRER_RE =
  "^https?://((www\\.)?nsfwdroid\\.com|localhost|127\\.0\\.0\\.1)(:[0-9]+)?/";

/** Admin pages link titles straight at /api/go; those are not storefront plays. */
export const ADMIN_REFERRER_RE = "^https?://[^/]+/admin($|/|\\?)";

/**
 * Count a redirect as a play click only when a browser that passed the age
 * gate followed a same-host link from a public page. Crawlers GET /api/go
 * with no cookie and usually no referrer. Ingest never calls this path.
 */
export function shouldRecordOutboundClick(input: {
  requestUrl: string;
  referrer: string | null | undefined;
  ageVerified: boolean;
}): boolean {
  if (!input.ageVerified) return false;
  if (!input.referrer) return false;
  let ref: URL;
  let req: URL;
  try {
    ref = new URL(input.referrer);
    req = new URL(input.requestUrl);
  } catch {
    return false;
  }
  if (ref.host !== req.host) return false;
  if (ref.pathname === "/admin" || ref.pathname.startsWith("/admin/")) return false;
  return true;
}

/** SQL predicate for outbound_click rows that match shouldRecordOutboundClick. */
export function visitorOutboundClickSql(): SQL {
  return sql`event_type = 'outbound_click'
    AND session_hash = ${AGE_VERIFIED_SESSION_HASH}
    AND referrer ~ ${VISITOR_REFERRER_RE}
    AND referrer !~ ${ADMIN_REFERRER_RE}`;
}

export function visitorClickConditions(since?: Date): SQL {
  const parts: SQL[] = [
    eq(analyticsEvents.eventType, "outbound_click"),
    eq(analyticsEvents.sessionHash, AGE_VERIFIED_SESSION_HASH),
    sql`${analyticsEvents.referrer} ~ ${VISITOR_REFERRER_RE}`,
    sql`${analyticsEvents.referrer} !~ ${ADMIN_REFERRER_RE}`,
  ];
  if (since) parts.push(gte(analyticsEvents.createdAt, since));
  return and(...parts) as SQL;
}
