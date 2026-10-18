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

/** Ops scripts and cloud agents send this so verify traffic does not hit play stats. */
export const INTERNAL_ANALYTICS_HEADER = "x-nsfwdroid-internal";

const BOT_USER_AGENT_RE =
  /curl\/|wget\/|HeadlessChrome|Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|NSFW-Droid-Catalog|puppeteer|Playwright\/|python-requests|Go-http-client|axios\/|node-fetch|scrapy|httpie|GPTBot|Claude-Web|Bytespider/i;

export type AnalyticsAudience = "visitors" | "all";

export function parseAnalyticsAudience(raw: string | null | undefined): AnalyticsAudience {
  return raw === "all" ? "all" : "visitors";
}

export function isInternalAnalyticsRequest(
  headers: { get(name: string): string | null },
): boolean {
  const v = headers.get(INTERNAL_ANALYTICS_HEADER)?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function isLikelyBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent?.trim()) return false;
  return BOT_USER_AGENT_RE.test(userAgent);
}

/** Skip recording when probes, bots, or signed-in admin QA would pollute visitor metrics. */
export function shouldSkipAnalyticsRecording(input: {
  userAgent: string | null | undefined;
  internalRequest: boolean;
  adminSession: boolean;
}): boolean {
  if (input.internalRequest) return true;
  if (input.adminSession) return true;
  if (isLikelyBotUserAgent(input.userAgent)) return true;
  return false;
}

/** Rows tagged at ingest time (legacy) or excluded from visitor rollups. */
export function excludeTaggedNonVisitorSql(): SQL {
  return sql`coalesce(metadata->>'internal', '') NOT IN ('true', '1')
    AND coalesce(metadata->>'adminSession', '') NOT IN ('true', '1')`;
}

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
  userAgent?: string | null;
  internalRequest?: boolean;
  adminSession?: boolean;
}): boolean {
  if (
    shouldSkipAnalyticsRecording({
      userAgent: input.userAgent,
      internalRequest: Boolean(input.internalRequest),
      adminSession: Boolean(input.adminSession),
    })
  ) {
    return false;
  }
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
    AND referrer !~ ${ADMIN_REFERRER_RE}
    AND ${excludeTaggedNonVisitorSql()}`;
}

/** listing_view rows suitable for visitor impression charts (excludes tagged internal/admin). */
export function visitorListingViewSql(extraPath?: SQL): SQL {
  const pathClause = extraPath ?? sql`true`;
  return sql`event_type = 'listing_view'
    AND ${pathClause}
    AND ${excludeTaggedNonVisitorSql()}`;
}

/** Browsers with their own analytics_sid. Excludes the old shared age-gate hash. */
export function uniqueBrowserSessionSql(): SQL {
  return sql`session_hash is not null
    AND session_hash <> ${AGE_VERIFIED_SESSION_HASH}
    AND session_hash <> ${ANON_SESSION_HASH}`;
}

function drizzleExcludeTaggedNonVisitorSql(): SQL {
  return sql`coalesce(${analyticsEvents.metadata}->>'internal', '') NOT IN ('true', '1')
    AND coalesce(${analyticsEvents.metadata}->>'adminSession', '') NOT IN ('true', '1')`;
}

export function visitorClickConditions(since?: Date): SQL {
  const parts: SQL[] = [
    eq(analyticsEvents.eventType, "outbound_click"),
    sql`${analyticsEvents.referrer} IS NOT NULL`,
    sql`${analyticsEvents.referrer} ~ ${VISITOR_REFERRER_RE}`,
    sql`${analyticsEvents.referrer} !~ ${ADMIN_REFERRER_RE}`,
    drizzleExcludeTaggedNonVisitorSql(),
  ];
  if (since) parts.push(gte(analyticsEvents.createdAt, since));
  return and(...parts) as SQL;
}

/** Raw /api/go rows (includes crawler and admin-link noise). */
export function allOutboundClickSql(): SQL {
  return sql`event_type = 'outbound_click'`;
}
