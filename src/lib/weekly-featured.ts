import { and, desc, gte, inArray, lt, sql } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { listings, type Listing, userFavorites } from "@/db/schema";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";
import {
  formatPreviousWeekRangeLabel,
  previousWeekFavoriteWindow,
  type PreviousWeekFavoriteWindow,
} from "@/lib/catalog-week";
import { FEATURED_RAIL_LIMIT } from "@/lib/featured-listings";

export type WeeklyFeaturedResult = {
  listings: Listing[];
  window: PreviousWeekFavoriteWindow;
  /** Hero subtitle when driven by last week's favorites. */
  heroSubtitle: string | null;
  source: "weekly_favorites" | "none";
};

export function weeklyFeaturedHeroSubtitle(window: PreviousWeekFavoriteWindow): string {
  const range = formatPreviousWeekRangeLabel(window);
  return `Featured pick from last week's favorites (${range}).`;
}

/**
 * Homepage featured rail: order by ♡ saves in the previous calendar week (ET by default).
 * Shown throughout the current week; updates each Monday.
 */
export async function getWeeklyFeaturedByFavorites(
  db: CatalogDb,
  limit = FEATURED_RAIL_LIMIT,
  now = new Date(),
): Promise<WeeklyFeaturedResult> {
  const window = previousWeekFavoriteWindow(now);
  const rows = await db
    .select({
      listingId: userFavorites.listingId,
      favorites: sql<number>`count(*)::int`,
    })
    .from(userFavorites)
    .where(
      and(
        gte(userFavorites.createdAt, window.statsStart),
        lt(userFavorites.createdAt, window.statsEnd),
      ),
    )
    .groupBy(userFavorites.listingId)
    .orderBy(desc(sql`count(*)`), userFavorites.listingId);

  if (rows.length === 0) {
    return { listings: [], window, heroSubtitle: null, source: "none" };
  }

  const orderedIds = rows.map((r) => r.listingId).filter(Boolean).slice(0, limit);

  const catalogRows = await db
    .select()
    .from(listings)
    .where(and(publicCatalogLinkStatus(), inArray(listings.id, orderedIds)));

  const byId = new Map(catalogRows.map((r) => [r.id, r]));
  const listingsOrdered = orderedIds
    .map((id) => byId.get(id))
    .filter((row): row is Listing => Boolean(row))
    .slice(0, limit);

  if (listingsOrdered.length === 0) {
    return { listings: [], window, heroSubtitle: null, source: "none" };
  }

  return {
    listings: listingsOrdered,
    window,
    heroSubtitle: weeklyFeaturedHeroSubtitle(window),
    source: "weekly_favorites",
  };
}
