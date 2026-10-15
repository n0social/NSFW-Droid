import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { analyticsEvents, listings, userFavorites } from "@/db/schema";
import { createHash } from "crypto";
import {
  ANALYTICS_RANK_POOL,
  mergeEngagementSignals,
  RANK_WEIGHT_FAVORITE_ON_HOT,
  RANK_WEIGHT_FAVORITE_ON_TRENDING,
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

const HOT_DAYS = 7;

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
    const since = new Date(Date.now() - HOT_DAYS * 24 * 60 * 60 * 1000);
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

    const favoriteByListing = await favoriteCountsSince(null);
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
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
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
    const ranked = mergeEngagementSignals(
      viewRows.map((r) => ({ listingId: r.listingId, count: r.views })),
      favoriteByListing,
      RANK_WEIGHT_FAVORITE_ON_TRENDING,
      pool,
    );

    const games = await listingsByAnalyticsIds(
      ranked.map((r) => ({ listingId: r.listingId })),
    );
    return games.slice(0, limit);
  } catch (err) {
    console.error("[analytics] getRecentPopular failed:", err);
    return [];
  }
}
