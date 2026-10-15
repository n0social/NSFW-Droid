import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  adminAuditLog,
  analyticsEvents,
  ingestRuns,
  ingestSources,
  listings,
  userFavorites,
} from "@/db/schema";

export type AdminDashboardSnapshot = {
  generatedAt: string;
  catalog: {
    listings: number;
    staleListings: number;
    pendingCandidates: number;
  };
  users: {
    total: number;
    signups24h: number;
    signups7d: number;
    favoritesTotal: number;
  };
  analytics: {
    outboundClicks24h: number;
    outboundClicks7d: number;
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

  const usersResult = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM user_profile) AS total,
      (SELECT count(*)::int FROM user_profile WHERE created_at >= ${since24h}) AS signups_24h,
      (SELECT count(*)::int FROM user_profile WHERE created_at >= ${since7d}) AS signups_7d,
      (SELECT count(*)::int FROM user_favorite) AS favorites_total
  `);

  const analyticsResult = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'outbound_click' AND created_at >= ${since24h}) AS clicks_24h,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'outbound_click' AND created_at >= ${since7d}) AS clicks_7d,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'listing_view' AND created_at >= ${since24h}) AS views_24h,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'listing_view' AND created_at >= ${since7d}) AS views_7d,
      (SELECT count(*)::int FROM analytics_event WHERE event_type = 'page_view' AND created_at >= ${since24h}) AS page_views_24h
  `);

  const clicks7d = await topListingsByEvent("outbound_click", since7d, 10);
  const views48h = await topListingsByEvent("listing_view", since48h, 10);
  const favoritesTop = await topListingsByFavorites(10);

  const sources = await db.select().from(ingestSources).orderBy(ingestSources.name);
  const runs = await db
    .select()
    .from(ingestRuns)
    .orderBy(desc(ingestRuns.startedAt))
    .limit(15);
  const audit = await db
    .select()
    .from(adminAuditLog)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(20);

  const catalog = catalogResult.rows[0] as Record<string, number>;
  const users = usersResult.rows[0] as Record<string, number>;
  const analytics = analyticsResult.rows[0] as Record<string, number>;

  return {
    generatedAt: new Date().toISOString(),
    catalog: {
      listings: catalog.listings ?? 0,
      staleListings: catalog.stale_listings ?? 0,
      pendingCandidates: catalog.pending_candidates ?? 0,
    },
    users: {
      total: users.total ?? 0,
      signups24h: users.signups_24h ?? 0,
      signups7d: users.signups_7d ?? 0,
      favoritesTotal: users.favorites_total ?? 0,
    },
    analytics: {
      outboundClicks24h: analytics.clicks_24h ?? 0,
      outboundClicks7d: analytics.clicks_7d ?? 0,
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
  };
}

async function topListingsByEvent(
  eventType: "outbound_click" | "listing_view",
  since: Date,
  limit: number,
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
    .where(and(eq(analyticsEvents.eventType, eventType), gte(analyticsEvents.createdAt, since)))
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
