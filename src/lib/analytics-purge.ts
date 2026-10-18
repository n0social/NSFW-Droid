import { sql, type SQL } from "drizzle-orm";
import {
  ADMIN_REFERRER_RE,
  AGE_VERIFIED_SESSION_HASH,
  ANON_SESSION_HASH,
  isLikelyBotUserAgent,
  SHARED_LEGACY_SESSION_HASHES,
  storedLikelyBotUserAgentSql,
  VISITOR_REFERRER_RE,
  visitorQualityListingViewSql,
  visitorQualityOutboundClickSql,
} from "@/lib/analytics-quality";

export type AnalyticsEventPurgeRow = {
  eventType: "outbound_click" | "listing_view" | "page_view" | string;
  referrer?: string | null;
  path?: string | null;
  sessionHash?: string | null;
  metadata?: Record<string, unknown> | null;
};

/** DELETE predicate: rows that are not visitor-quality engagement signal. */
export function inflatedAnalyticsEventSql(): SQL {
  return sql`
    (${storedLikelyBotUserAgentSql()})
    OR (event_type = 'outbound_click' AND NOT (${visitorQualityOutboundClickSql()}))
    OR (event_type = 'listing_view' AND NOT (${visitorQualityListingViewSql()}))
    OR (event_type = 'page_view' AND (
      session_hash IS NULL
      OR session_hash = ${AGE_VERIFIED_SESSION_HASH}
      OR session_hash = ${ANON_SESSION_HASH}
    ))
  `;
}

function isTaggedNonVisitor(metadata: Record<string, unknown> | null | undefined): boolean {
  const internal = String(metadata?.internal ?? "");
  const adminSession = String(metadata?.adminSession ?? "");
  return internal === "true" || internal === "1" || adminSession === "true" || adminSession === "1";
}

function hasPerBrowserSession(sessionHash: string | null | undefined): boolean {
  if (!sessionHash) return false;
  return !(SHARED_LEGACY_SESSION_HASHES as readonly string[]).includes(sessionHash);
}

function isVisitorOutboundReferrer(referrer: string | null | undefined): boolean {
  if (!referrer) return false;
  if (!new RegExp(VISITOR_REFERRER_RE).test(referrer)) return false;
  if (new RegExp(ADMIN_REFERRER_RE).test(referrer)) return false;
  return true;
}

function isVisitorQualityOutboundClick(row: AnalyticsEventPurgeRow): boolean {
  if (row.eventType !== "outbound_click") return false;
  if (isTaggedNonVisitor(row.metadata)) return false;
  if (!isVisitorOutboundReferrer(row.referrer)) return false;
  if (!hasPerBrowserSession(row.sessionHash)) return false;
  const ua = row.metadata?.userAgent;
  if (typeof ua === "string" && isLikelyBotUserAgent(ua)) return false;
  return true;
}

function isVisitorQualityListingView(row: AnalyticsEventPurgeRow): boolean {
  if (row.eventType !== "listing_view") return false;
  if (isTaggedNonVisitor(row.metadata)) return false;
  if (!hasPerBrowserSession(row.sessionHash)) return false;
  const ua = row.metadata?.userAgent;
  if (typeof ua === "string" && isLikelyBotUserAgent(ua)) return false;
  return true;
}

function isVisitorQualityPageView(row: AnalyticsEventPurgeRow): boolean {
  if (row.eventType !== "page_view") return false;
  return hasPerBrowserSession(row.sessionHash);
}

/** Mirror of inflatedAnalyticsEventSql() for unit tests without a database. */
export function isInflatedAnalyticsRow(row: AnalyticsEventPurgeRow): boolean {
  if (row.metadata?.userAgent && typeof row.metadata.userAgent === "string") {
    if (isLikelyBotUserAgent(row.metadata.userAgent)) return true;
  }
  if (row.eventType === "outbound_click") return !isVisitorQualityOutboundClick(row);
  if (row.eventType === "listing_view") return !isVisitorQualityListingView(row);
  if (row.eventType === "page_view") return !isVisitorQualityPageView(row);
  return false;
}

export function isVisitorQualityAnalyticsRow(row: AnalyticsEventPurgeRow): boolean {
  if (row.eventType === "outbound_click") return isVisitorQualityOutboundClick(row);
  if (row.eventType === "listing_view") return isVisitorQualityListingView(row);
  if (row.eventType === "page_view") return isVisitorQualityPageView(row);
  return true;
}
