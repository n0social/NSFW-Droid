import { and, desc, eq, gte, sql, type SQL } from "drizzle-orm";
import {
  uniqueBrowserSessionSql,
  visitorClickConditions,
  visitorOutboundClickSql,
} from "@/lib/analytics-quality";
import { getDb } from "@/db";
import {
  countListingsAddedInDays,
  DEFAULT_NEW_ARRIVALS_REPORT_DAYS,
  listListingsAddedInDays,
  type NewArrivalListingRow,
} from "@/lib/catalog-new-arrivals-report";
import {
  adminAuditLog,
  analyticsEvents,
  ingestRuns,
  ingestSources,
  listingReports,
  listings,
  userFavorites,
} from "@/db/schema";

export type AdminDashboardSnapshot = {
  generatedAt: string;
  revenue: {
    adsEnabled: boolean;
  };
  catalog: {
    listings: number;
    staleListings: number;
    pendingCandidates: number;
    listingsBySource: { source: string; count: number }[];
    softCap: number | null;
    addedLast7d: number;
  };
  newArrivals7d: NewArrivalListingRow[];
  users: {
    total: number;
    signups24h: number;
    signups7d: number;
    favoritesTotal: number;
  };
  analytics: {
    /** Age-verified same-host plays. Excludes crawler GETs and /admin. */
    playClicks24h: number;
    playClicks7d: number;
    /** Distinct analytics_sid values. The old shared age-gate hash is excluded. */
    uniquePlayBrowsers24h: number;
    uniqueImpressionBrowsers24h: number;
    /** /api/go hits that are not play clicks (no age cookie, no referrer, or admin). */
    unverifiedGoHits24h: number;
    outboundClicks24h: number;
    outboundClicks7d: number;
    affiliateClicks24h: number;
    affiliateClicks7d: number;
    officialClicks24h: number;
    officialClicks7d: number;
    /** listing_view rows with path `/` — one per card painted on screen. */
    cardImpressions24h: number;
    cardImpressions7d: number;
    /** listing_view rows from a game detail page. */
    detailViews24h: number;
    listingViews24h: number;
    listingViews7d: number;
    pageViews24h: number;
  };
  top: {
    clicks7d: TopListingRow[];
    views48h: TopListingRow[];
    favorites: TopListingRow[];
  };
  ingestSources: {
    name: string;
    lastRunAt: string | null;
    lastError: string | null;
    cursor: unknown;
  }[];
  recentIngestRuns: {
    id: string;
    job: string;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    summary: unknown;
    errorMessage: string | null;
  }[];
  recentAudit: {
    id: string;
    action: string;
    actor: string;
    targetId: string | null;
    createdAt: string;
    metadata: unknown;
  }[];
  recentListingReports: {
    id: string;
    listingId: string;
    listingTitle: string;
    listingSlug: string;
    reason: string;
    details: string | null;
    createdAt: string;
  }[];
};

export type TopListingRow = {
  listingId: string;
  title: string;
  slug: string;
  count: number;
};

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const db = await getDb();
  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000);
  const since48h = new Date(now - 48 * 60 * 60 * 1000);
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const catalogResult = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM listing) AS listings,
      (SELECT count(*)::int FROM listing WHERE catalog_stale = true) AS stale_listings,
      (SELECT count(*)::int FROM candidate WHERE review_status = 'pending') AS pending_candidates
  `);

  const bySourceResult = await db.execute(sql`
    SELECT coalesce(source::text, 'unknown') AS source, count(*)::int AS count
    FROM listing
    GROUP BY source
    ORDER BY count DESC
  `);

  const usersResult = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM user_profile) AS total,
      (SELECT count(*)::int FROM user_profile WHERE created_at >= ${since24h}) AS signups_24h,
      (SELECT count(*)::int FROM user_profile WHERE created_at >= ${since7d}) AS signups_7d,
      (SELECT count(*)::int FROM user_favorite) AS favorites_total
  `);

  const play = visitorOutboundClickSql();
  const browsers = uniqueBrowserSessionSql();
  const analyticsResult = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM analytics_event WHERE ${play} AND created_at >= ${since24h}) AS play_clicks_24h,
      (SELECT count(*)::int FROM analytics_event WHERE ${play} AND created_at >= ${since7d}) AS play_clicks_7d,
      (SELECT count(distinct session_hash)::int FROM analytics_event WHERE ${play} AND ${browsers} AND created_at >= ${since24h}) AS unique_play_browsers_24h,
      (SELECT count(distinct session_hash)::int FROM analytics_event WHERE event_type = 'listing_view' AND path = '/' AND ${browsers} AND created_at >= ${since24h}) AS unique_impression_browsers_24h,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'outbound_click' AND created_at >= ${since24h} AND NOT (${play})) AS unverified_go_24h,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'outbound_click' AND created_at >= ${since24h}) AS clicks_24h,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'outbound_click' AND created_at >= ${since7d}) AS clicks_7d,
      (SELECT count(*)::int FROM analytics_event WHERE ${play} AND created_at >= ${since24h} AND metadata->>'linkKind' = 'affiliate') AS affiliate_clicks_24h,
      (SELECT count(*)::int FROM analytics_event WHERE ${play} AND created_at >= ${since7d} AND metadata->>'linkKind' = 'affiliate') AS affiliate_clicks_7d,
      (SELECT count(*)::int FROM analytics_event WHERE ${play} AND created_at >= ${since24h} AND (metadata->>'linkKind' = 'official' OR metadata->>'linkKind' IS NULL)) AS official_clicks_24h,
      (SELECT count(*)::int FROM analytics_event WHERE ${play} AND created_at >= ${since7d} AND (metadata->>'linkKind' = 'official' OR metadata->>'linkKind' IS NULL)) AS official_clicks_7d,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'listing_view' AND path = '/' AND created_at >= ${since24h}) AS card_impressions_24h,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'listing_view' AND path = '/' AND created_at >= ${since7d}) AS card_impressions_7d,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'listing_view' AND path LIKE '/game/%' AND created_at >= ${since24h}) AS detail_views_24h,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'listing_view' AND created_at >= ${since24h}) AS views_24h,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'listing_view' AND created_at >= ${since7d}) AS views_7d,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'page_view' AND created_at >= ${since24h}) AS page_views_24h
  `);

  const clicks7d = await topPlayClicks(since7d, 10);
  const views48h = await topListingsByEvent("listing_view", since48h, 10, sql`path = '/'`);
  const favoritesTop = await topListingsByFavorites(10);

  const [newArrivalsTotals, newArrivals7d] = await Promise.all([
    countListingsAddedInDays(DEFAULT_NEW_ARRIVALS_REPORT_DAYS),
    listListingsAddedInDays(DEFAULT_NEW_ARRIVALS_REPORT_DAYS, 100),
  ]);

  const sources = await db.select().from(ingestSources).orderBy(ingestSources.name);
  const runs = await db
    .select()
    .from(ingestRuns)
    .orderBy(desc(ingestRuns.startedAt))
    .limit(20);
  const audit = await db
    .select()
    .from(adminAuditLog)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(20);

  const listingReportRows = await db
    .select({
      id: listingReports.id,
      listingId: listingReports.listingId,
      reason: listingReports.reason,
      details: listingReports.details,
      createdAt: listingReports.createdAt,
      listingTitle: listings.title,
      listingSlug: listings.slug,
    })
    .from(listingReports)
    .innerJoin(listings, eq(listings.id, listingReports.listingId))
    .orderBy(desc(listingReports.createdAt))
    .limit(50);

  const catalog = catalogResult.rows[0] as Record<string, number>;
  const users = usersResult.rows[0] as Record<string, number>;
  const analytics = analyticsResult.rows[0] as Record<string, number>;

  return {
    generatedAt: new Date().toISOString(),
    revenue: {
      adsEnabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "1",
    },
    catalog: {
      listings: catalog.listings ?? 0,
      staleListings: catalog.stale_listings ?? 0,
      pendingCandidates: catalog.pending_candidates ?? 0,
      listingsBySource: (bySourceResult.rows as { source: string; count: number }[]).map((r) => ({
        source: r.source,
        count: r.count,
      })),
      softCap: Number(process.env.CATALOG_SOFT_CAP ?? "") > 0
        ? Number(process.env.CATALOG_SOFT_CAP)
        : null,
      addedLast7d: newArrivalsTotals.addedLiveByFirstSeen,
    },
    newArrivals7d,
    users: {
      total: users.total ?? 0,
      signups24h: users.signups_24h ?? 0,
      signups7d: users.signups_7d ?? 0,
      favoritesTotal: users.favorites_total ?? 0,
    },
    analytics: {
      playClicks24h: analytics.play_clicks_24h ?? 0,
      playClicks7d: analytics.play_clicks_7d ?? 0,
      uniquePlayBrowsers24h: analytics.unique_play_browsers_24h ?? 0,
      uniqueImpressionBrowsers24h: analytics.unique_impression_browsers_24h ?? 0,
      unverifiedGoHits24h: analytics.unverified_go_24h ?? 0,
      outboundClicks24h: analytics.clicks_24h ?? 0,
      outboundClicks7d: analytics.clicks_7d ?? 0,
      affiliateClicks24h: analytics.affiliate_clicks_24h ?? 0,
      affiliateClicks7d: analytics.affiliate_clicks_7d ?? 0,
      officialClicks24h: analytics.official_clicks_24h ?? 0,
      officialClicks7d: analytics.official_clicks_7d ?? 0,
      cardImpressions24h: analytics.card_impressions_24h ?? 0,
      cardImpressions7d: analytics.card_impressions_7d ?? 0,
      detailViews24h: analytics.detail_views_24h ?? 0,
      listingViews24h: analytics.views_24h ?? 0,
      listingViews7d: analytics.views_7d ?? 0,
      pageViews24h: analytics.page_views_24h ?? 0,
    },
    top: {
      clicks7d,
      views48h,
      favorites: favoritesTop,
    },
    ingestSources: sources.map((s) => ({
      name: s.name,
      lastRunAt: s.lastRunAt?.toISOString() ?? null,
      lastError: s.lastError,
      cursor: s.cursor,
    })),
    recentIngestRuns: runs.map((r) => ({
      id: r.id,
      job: r.job,
      status: r.status,
      startedAt: r.startedAt.toISOString(),
      finishedAt: r.finishedAt?.toISOString() ?? null,
      summary: r.summary,
      errorMessage: r.errorMessage,
    })),
    recentAudit: audit.map((a) => ({
      id: a.id,
      action: a.action,
      actor: a.actor,
      targetId: a.targetId,
      createdAt: a.createdAt.toISOString(),
      metadata: a.metadata,
    })),
    recentListingReports: listingReportRows.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      listingTitle: r.listingTitle,
      listingSlug: r.listingSlug,
      reason: r.reason,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
    })),
  };
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

async function topListingsByEvent(
  eventType: "outbound_click" | "listing_view",
  since: Date,
  limit: number,
  extra?: SQL,
): Promise<TopListingRow[]> {
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
    .where(and(eq(analyticsEvents.eventType, eventType), gte(analyticsEvents.createdAt, since), extra))
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

async function topListingsByFavorites(limit: number): Promise<TopListingRow[]> {
  const db = await getDb();
  const rows = await db
    .select({
      listingId: userFavorites.listingId,
      count: sql<number>`count(*)::int`,
      title: listings.title,
      slug: listings.slug,
    })
    .from(userFavorites)
    .innerJoin(listings, eq(listings.id, userFavorites.listingId))
    .groupBy(userFavorites.listingId, listings.title, listings.slug)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  return rows.map((r) => ({
    listingId: r.listingId,
    title: r.title,
    slug: r.slug,
    count: r.count,
  }));
}
