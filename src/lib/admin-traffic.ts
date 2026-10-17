import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { adminAuditLog, analyticsEvents, listings } from "@/db/schema";
import { logAdminAction } from "@/lib/admin-audit";
import { visitorClickConditions, visitorOutboundClickSql } from "@/lib/analytics-quality";
import type { TopListingRow } from "@/lib/admin-dashboard";

export type DailyTrafficRow = {
  day: string;
  outboundClicks: number;
  listingViews: number;
};

export type DailyTrafficSummary = {
  outboundClicks: number;
  listingViews: number;
};

export type AdminTrafficSnapshot = {
  generatedAt: string;
  windowDays: number;
  totals: {
    outboundClicks: number;
    unverifiedGoHits: number;
    listingViews: number;
    pageViews: number;
    allEvents: number;
  };
  /** UTC calendar-day rollups (from the daily series). */
  dailySummary: {
    today: DailyTrafficSummary;
    yesterday: DailyTrafficSummary;
    last7d: DailyTrafficSummary;
  };
  daily: DailyTrafficRow[];
  topClicks7d: TopListingRow[];
  trafficMarkerBaselineAt: string | null;
};

const TRAFFIC_MARKER_ACTION = "traffic_marker_baseline";

export async function getAdminTrafficSnapshot(windowDays = 30): Promise<AdminTrafficSnapshot> {
  const db = await getDb();
  const now = Date.now();
  const sinceWindow = new Date(now - windowDays * 24 * 60 * 60 * 1000);
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const play = visitorOutboundClickSql();
  const totalsResult = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM analytics_event WHERE ${play}) AS outbound_clicks,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'outbound_click' AND NOT (${play})) AS unverified_go_hits,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'listing_view' AND path = '/') AS listing_views,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'page_view') AS page_views,
      (SELECT count(*)::int FROM analytics_event) AS all_events
  `);

  const dailyResult = await db.execute(sql`
    SELECT
      d.day::text AS day,
      coalesce(c.clicks, 0)::int AS outbound_clicks,
      coalesce(v.views, 0)::int AS listing_views
    FROM (
      SELECT generate_series(
        date_trunc('day', ${sinceWindow}::timestamptz AT TIME ZONE 'UTC')::date,
        date_trunc('day', now() AT TIME ZONE 'UTC')::date,
        '1 day'::interval
      )::date AS day
    ) d
    LEFT JOIN (
      SELECT (created_at AT TIME ZONE 'UTC')::date AS day, count(*)::int AS clicks
      FROM analytics_event
      WHERE ${play} AND created_at >= ${sinceWindow}
      GROUP BY 1
    ) c ON c.day = d.day
    LEFT JOIN (
      SELECT (created_at AT TIME ZONE 'UTC')::date AS day, count(*)::int AS views
      FROM analytics_event
      WHERE event_type = 'listing_view' AND path = '/' AND created_at >= ${sinceWindow}
      GROUP BY 1
    ) v ON v.day = d.day
    ORDER BY d.day
  `);

  const topClicks7d = await topPlayClicks(since7d, 15);

  const markerRows = await db
    .select({ createdAt: adminAuditLog.createdAt })
    .from(adminAuditLog)
    .where(eq(adminAuditLog.action, TRAFFIC_MARKER_ACTION))
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(1);

  const totals = totalsResult.rows[0] as Record<string, unknown>;

  const daily = (dailyResult.rows as { day: string; outbound_clicks: number; listing_views: number }[]).map(
    (r) => ({
      day: r.day,
      outboundClicks: r.outbound_clicks,
      listingViews: r.listing_views,
    }),
  );

  const dailySummary = summarizeDailyTraffic(daily);

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    totals: {
      outboundClicks: Number(totals.outbound_clicks ?? 0),
      unverifiedGoHits: Number(totals.unverified_go_hits ?? 0),
      listingViews: Number(totals.listing_views ?? 0),
      pageViews: Number(totals.page_views ?? 0),
      allEvents: Number(totals.all_events ?? 0),
    },
    dailySummary,
    daily,
    topClicks7d,
    trafficMarkerBaselineAt: markerRows[0]?.createdAt.toISOString() ?? null,
  };
}

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function emptySummary(): DailyTrafficSummary {
  return { outboundClicks: 0, listingViews: 0 };
}

function summarizeDailyTraffic(daily: DailyTrafficRow[]): AdminTrafficSnapshot["dailySummary"] {
  const byDay = new Map(daily.map((row) => [row.day, row]));
  const todayKey = utcDayKey(new Date());
  const yesterdayKey = utcDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const todayRow = byDay.get(todayKey);
  const yesterdayRow = byDay.get(yesterdayKey);

  const last7 = daily.slice(-7);
  const last7d: DailyTrafficSummary = last7.reduce(
    (acc, row) => ({
      outboundClicks: acc.outboundClicks + row.outboundClicks,
      listingViews: acc.listingViews + row.listingViews,
    }),
    emptySummary(),
  );

  return {
    today: todayRow
      ? { outboundClicks: todayRow.outboundClicks, listingViews: todayRow.listingViews }
      : emptySummary(),
    yesterday: yesterdayRow
      ? { outboundClicks: yesterdayRow.outboundClicks, listingViews: yesterdayRow.listingViews }
      : emptySummary(),
    last7d,
  };
}

/** Idempotent: records when the traffic marker admin UI first loaded in production. */
export async function ensureTrafficMarkerBaseline(): Promise<string | null> {
  const db = await getDb();
  const existing = await db
    .select({ createdAt: adminAuditLog.createdAt })
    .from(adminAuditLog)
    .where(eq(adminAuditLog.action, TRAFFIC_MARKER_ACTION))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].createdAt.toISOString();
  }

  const snapshot = await getAdminTrafficSnapshot(30);
  await logAdminAction({
    action: TRAFFIC_MARKER_ACTION,
    metadata: {
      shippedAt: new Date().toISOString(),
      totals: snapshot.totals,
      windowDays: snapshot.windowDays,
    },
  });

  return new Date().toISOString();
}

async function topPlayClicks(since: Date, limit: number): Promise<TopListingRow[]> {
  const db = await getDb();
  const rows = await db
    .select({
      listingId: analyticsEvents.listingId,
      count: sql<number>`count(*)::int`,
      title: listings.title,
      slug: listings.slug,
    })
    .from(analyticsEvents)
    .innerJoin(listings, eq(listings.id, analyticsEvents.listingId))
    .where(visitorClickConditions(since))
    .groupBy(analyticsEvents.listingId, listings.title, listings.slug)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  return rows
    .filter((r) => r.listingId)
    .map((r) => ({
      listingId: r.listingId!,
      title: r.title,
      slug: r.slug,
      count: r.count,
    }));
}

