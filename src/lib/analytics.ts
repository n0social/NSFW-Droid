import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { analyticsEvents, listings, userFavorites } from "@/db/schema";
import { createHash } from "crypto";
import {
  ANALYTICS_RANK_POOL,
  HOT_ENGAGEMENT_DAYS,
  mergeEngagementSignals,
  RANK_WEIGHT_FAVORITE_ON_HOT,
  RANK_WEIGHT_FAVORITE_ON_TRENDING,
  sortTrendingVelocityRows,
  TRENDING_VIEW_HOURS,
} from "@/lib/listings-ranking";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";

export async function recordEvent(input: {
  eventType: "outbound_click" | "listing_view" | "page_view";
  listingId?: string;
  path?: string;
  referrer?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const db = await getDb();
    const sessionHash = input.sessionId
      ? createHash("sha256").update(input.sessionId).digest("hex").slice(0, 32)
      : null;
    if (
      input.eventType === "listing_view" &&
      input.listingId &&
      sessionHash &&
      (await hasRecentListingView(input.listingId, sessionHash, input.path ?? ""))
    ) {
      return;
    }
    await db.insert(analyticsEvents).values({
      eventType: input.eventType,
      listingId: input.listingId ?? null,
      path: input.path ?? null,
      referrer: input.referrer ?? null,
      sessionHash,
      metadata: input.metadata ?? null,
    });
  } catch (err) {
    console.error("[analytics] recordEvent failed:", err);
  }
}

/** One card or detail impression per browser per listing per path per day. */
async function hasRecentListingView(
  listingId: string,
  sessionHash: string,
  path: string,
): Promise<boolean> {
  const db = await getDb();
  const prior = await db.execute(sql`
    select 1 as one
    from analytics_event
    where event_type = 'listing_view'
      and listing_id = ${listingId}::uuid
      and session_hash = ${sessionHash}
      and coalesce(path, '') = ${path}
      and created_at >= now() - interval '24 hours'
    limit 1
  `);
  return prior.rows.length > 0;
}

/** Leaderboard favorite signal: rows in `user_favorite` only (authenticated saves). */
async function favoriteCountsSince(since: Date | null): Promise<Map<string, number>> {
  const db = await getDb();
  const query = db
    .select({
      listingId: userFavorites.listingId,
      count: sql<number>`count(*)::int`,
    })
    .from(userFavorites)
    .groupBy(userFavorites.listingId);

  const rows = since
    ? await query.where(gte(userFavorites.createdAt, since))
    : await query;

  return new Map(rows.map((r) => [r.listingId, r.count]));
}

async function listingsByAnalyticsIds(
  rows: { listingId: string | null }[],
): Promise<(typeof listings.$inferSelect)[]> {
  const ids = rows.map((r) => r.listingId).filter(Boolean) as string[];
  if (!ids.length) return [];

  const db = await getDb();
  const games = await db
    .select()
    .from(listings)
    .where(and(inArray(listings.id, ids), publicCatalogLinkStatus()));
  const byId = new Map(games.map((g) => [g.id, g]));
  const ordered: (typeof games)[0][] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (!r.listingId || seen.has(r.listingId)) continue;
    const game = byId.get(r.listingId);
    if (!game) continue;
    seen.add(r.listingId);
    ordered.push(game);
  }
  return ordered;
}

export async function getHotListings(limit = ANALYTICS_RANK_POOL) {
  try {
    const db = await getDb();
    const since = new Date(Date.now() - HOT_ENGAGEMENT_DAYS * 24 * 60 * 60 * 1000);
    const pool = Math.max(limit, ANALYTICS_RANK_POOL);
    const clickRows = await db
      .select({
        listingId: analyticsEvents.listingId,
        clicks: sql<number>`count(*)::int`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, "outbound_click"),
          gte(analyticsEvents.createdAt, since),
          isNotNull(analyticsEvents.listingId),
        ),
      )
      .groupBy(analyticsEvents.listingId)
      .orderBy(desc(sql`count(*)`))
      .limit(pool);

    const favoriteByListing = await favoriteCountsSince(since);
    const ranked = mergeEngagementSignals(
      clickRows.map((r) => ({ listingId: r.listingId, count: r.clicks })),
      favoriteByListing,
      RANK_WEIGHT_FAVORITE_ON_HOT,
      pool,
    );

    const games = await listingsByAnalyticsIds(
      ranked.map((r) => ({ listingId: r.listingId })),
    );
    return games
      .slice(0, limit)
      .map((game, i) => ({ ...game, chartRank: i + 1 }));
  } catch (err) {
    console.error("[analytics] getHotListings failed:", err);
    return [];
  }
}

export async function getRecentPopular(limit = ANALYTICS_RANK_POOL) {
  try {
    const db = await getDb();
    const since = new Date(Date.now() - TRENDING_VIEW_HOURS * 60 * 60 * 1000);
    const pool = Math.max(limit, ANALYTICS_RANK_POOL);
    const viewRows = await db
      .select({
        listingId: analyticsEvents.listingId,
        views: sql<number>`count(*)::int`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, "listing_view"),
          gte(analyticsEvents.createdAt, since),
          isNotNull(analyticsEvents.listingId),
        ),
      )
      .groupBy(analyticsEvents.listingId)
      .orderBy(desc(sql`count(*)`))
      .limit(pool);

    const favoriteByListing = await favoriteCountsSince(since);
    const candidateIds = [
      ...new Set([
        ...viewRows.map((r) => r.listingId).filter((id): id is string => Boolean(id)),
        ...favoriteByListing.keys(),
      ]),
    ];
    const firstSeenRows =
      candidateIds.length > 0
        ? await db
            .select({ id: listings.id, firstSeenAt: listings.firstSeenAt })
            .from(listings)
            .where(inArray(listings.id, candidateIds))
        : [];
    const firstSeenAtByListingId = new Map(
      firstSeenRows.map((r) => [r.id, r.firstSeenAt]),
    );

    const byId = new Map<string, { listingId: string; primary: number; favorites: number }>();
    for (const row of viewRows) {
      if (!row.listingId) continue;
      byId.set(row.listingId, {
        listingId: row.listingId,
        primary: row.views,
        favorites: favoriteByListing.get(row.listingId) ?? 0,
      });
    }
    for (const [listingId, favCount] of favoriteByListing) {
      if (!byId.has(listingId) && favCount > 0) {
        byId.set(listingId, { listingId, primary: 0, favorites: favCount });
      }
    }

    const ranked = sortTrendingVelocityRows(
      [...byId.values()],
      firstSeenAtByListingId,
      RANK_WEIGHT_FAVORITE_ON_TRENDING,
    ).slice(0, pool);

    const games = await listingsByAnalyticsIds(
      ranked.map((r) => ({ listingId: r.listingId })),
    );
    return games.slice(0, limit);
  } catch (err) {
    console.error("[analytics] getRecentPopular failed:", err);
    return [];
  }
}
