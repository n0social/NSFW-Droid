import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  type AnalyticsAudience,
  parseAnalyticsAudience,
  visitorOutboundClickSql,
} from "@/lib/analytics-quality";
import { getGscConfigStatus, gscWindowDays, isGscSyncEnabled } from "@/lib/gsc-config";
import {
  ensureGscSearchCache,
  readGscSearchCache,
  type GscSearchCacheFile,
} from "@/lib/gsc-cache";

export type AdminSearchSnapshot = {
  generatedAt: string;
  audience: AnalyticsAudience;
  gsc: {
    configured: boolean;
    propertyUrl: string | null;
    missingEnv: string[];
    cache: GscSearchCacheFile | null;
    windowDays: number;
  };
  /** First-party metrics — not equivalent to GSC Performance. */
  firstParty: {
    windowDays: number;
    googleReferrerEvents: {
      eventType: string;
      count: number;
    }[];
    visitorPlayClicks: number;
    note: string;
  };
};

const GOOGLE_REFERRER_RE = "google\\.|www\\.google\\.";

export async function getAdminSearchSnapshot(
  audience: AnalyticsAudience = "visitors",
): Promise<AdminSearchSnapshot> {
  const windowDays = gscWindowDays();
  const config = getGscConfigStatus();

  let cache: GscSearchCacheFile | null = null;
  if (config.configured) {
    cache = await ensureGscSearchCache({ refreshIfStale: true });
  } else {
    cache = await readGscSearchCache();
  }

  const firstParty = await getFirstPartySearchHints(windowDays, audience);

  return {
    generatedAt: new Date().toISOString(),
    audience,
    gsc: {
      configured: config.configured && isGscSyncEnabled(),
      propertyUrl: config.configured ? config.propertyUrl : null,
      missingEnv: config.configured ? [] : config.missing,
      cache,
      windowDays,
    },
    firstParty,
  };
}

async function getFirstPartySearchHints(
  windowDays: number,
  audience: AnalyticsAudience,
): Promise<AdminSearchSnapshot["firstParty"]> {
  const db = await getDb();
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const play =
    audience === "all"
      ? sql`event_type = 'outbound_click'`
      : visitorOutboundClickSql();

  const referrerBreakdown = await db.execute(sql`
    SELECT event_type, count(*)::int AS count
    FROM analytics_event
    WHERE created_at >= ${since}
      AND referrer IS NOT NULL
      AND referrer ~ ${GOOGLE_REFERRER_RE}
    GROUP BY event_type
    ORDER BY count DESC
  `);

  const playResult = await db.execute(sql`
    SELECT count(*)::int AS count
    FROM analytics_event
    WHERE ${play} AND created_at >= ${since}
  `);

  const playCount = Number((playResult.rows[0] as { count?: number })?.count ?? 0);

  return {
    windowDays,
    googleReferrerEvents: (
      referrerBreakdown.rows as { event_type: string; count: number }[]
    ).map((r) => ({
      eventType: r.event_type,
      count: r.count,
    })),
    visitorPlayClicks: playCount,
    note:
      "GSC counts Google Search clicks to this site (query + landing URL). First-party play clicks are age-verified /api/go visits and usually carry a same-site Referer, not google.com. Rows above only appear if an event stored a Google Referer header.",
  };
}

export { parseAnalyticsAudience };
