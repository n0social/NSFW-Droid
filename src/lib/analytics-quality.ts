import { createHash } from "crypto";
import { and, eq, gte, sql, type SQL } from "drizzle-orm";
import { analyticsEvents } from "@/db/schema";

/**
 * Historical rows hashed the age-gate cookie (`1`) or the literal `anon`.
 * Those two hashes are shared by every old browser. New events use
 * `analytics_sid`, one id per browser.
 */
export const AGE_VERIFIED_COOKIE_VALUE = "1";

export const AGE_VERIFIED_SESSION_HASH = createHash("sha256")
  .update(AGE_VERIFIED_COOKIE_VALUE)
  .digest("hex")
  .slice(0, 32);

export const ANON_SESSION_HASH = createHash("sha256").update("anon").digest("hex").slice(0, 32);

export const SHARED_LEGACY_SESSION_HASHES = [AGE_VERIFIED_SESSION_HASH, ANON_SESSION_HASH] as const;

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
  /** Public Host or X-Forwarded-Host. Behind the proxy, request.url is the internal address. */
  siteHost?: string | null;
  referrer: string | null | undefined;
  ageVerified: boolean;
}): boolean {
  if (!input.ageVerified) return false;
  if (!input.referrer) return false;
  let ref: URL;
  try {
    ref = new URL(input.referrer);
  } catch {
    return false;
  }
  const siteHost = (input.siteHost || safeHost(input.requestUrl) || "").split(",")[0].trim().toLowerCase();
  if (!siteHost || ref.host.toLowerCase() !== siteHost) return false;
  if (ref.pathname === "/admin" || ref.pathname.startsWith("/admin/")) return false;
  return true;
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/** SQL predicate for outbound_click rows that match shouldRecordOutboundClick. */
export function visitorOutboundClickSql(): SQL {
  return sql`event_type = 'outbound_click'
    AND referrer IS NOT NULL
    AND referrer ~ ${VISITOR_REFERRER_RE}
    AND referrer !~ ${ADMIN_REFERRER_RE}`;
}

/** Browsers with their own analytics_sid. Excludes the old shared age-gate hash. */
export function uniqueBrowserSessionSql(): SQL {
  return sql`session_hash is not null
    AND session_hash <> ${AGE_VERIFIED_SESSION_HASH}
    AND session_hash <> ${ANON_SESSION_HASH}`;
}

export function visitorClickConditions(since?: Date): SQL {
  const parts: SQL[] = [
    eq(analyticsEvents.eventType, "outbound_click"),
    sql`${analyticsEvents.referrer} IS NOT NULL`,
    sql`${analyticsEvents.referrer} ~ ${VISITOR_REFERRER_RE}`,
    sql`${analyticsEvents.referrer} !~ ${ADMIN_REFERRER_RE}`,
  ];
  if (since) parts.push(gte(analyticsEvents.createdAt, since));
  return and(...parts) as SQL;
}
