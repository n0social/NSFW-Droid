import { and, desc, sql } from "drizzle-orm";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";
import { listings, type Listing } from "@/db/schema";
import { getRecentPopular } from "@/lib/analytics";
import { getTagSlugsByListingIds } from "@/lib/listing-tags";
import {
  ANALYTICS_RANK_POOL,
  fillFeaturedRail,
  RAIL_HOT_LIMIT,
  RAIL_TRENDING_LIMIT,
} from "@/lib/listings-ranking";
import { safeCatalogQuery } from "@/lib/db-safe";
import {
  getRecentNewListings,
  listingFirstSeenAtExpr,
  newListingPublishedSinceCondition,
} from "@/lib/new-listings";
import { getFeaturedListings } from "@/lib/featured-listings";

const emptyStorefront = {
  topGrossing: [] as Listing[],
  newReleases: [] as Listing[],
  featured: [] as Listing[],
  all: [] as Listing[],
  rankingsFromAnalytics: false,
};

export type StorefrontListings = typeof emptyStorefront & {
  catalogUnavailable?: boolean;
};

export async function getListingsForStorefront(): Promise<StorefrontListings> {
  const result = await safeCatalogQuery(
    "getListingsForStorefront",
    emptyStorefront,
    async (db) => {
      const all = await db
        .select()
        .from(listings)
        .where(publicCatalogLinkStatus())
        .orderBy(desc(listings.publishedAt))
        .limit(48);

      const newestRaw = await getRecentNewListings(ANALYTICS_RANK_POOL);
      const trendingRaw = await getRecentPopular(ANALYTICS_RANK_POOL);

      const tagListingIds = [
        ...new Set([
          ...all.map((l) => l.id),
          ...newestRaw.map((l) => l.id),
          ...trendingRaw.map((l) => l.id),
        ]),
      ];
      const tagsByListingId = await getTagSlugsByListingIds(db, tagListingIds);

      const newestFallback = await db
        .select()
        .from(listings)
        .where(and(publicCatalogLinkStatus(), newListingPublishedSinceCondition()))
        .orderBy(desc(listingFirstSeenAtExpr()))
        .limit(RAIL_HOT_LIMIT);

      const topGrossing = fillFeaturedRail(
        newestRaw,
        newestFallback.length > 0 ? newestFallback : all.slice(0, RAIL_HOT_LIMIT),
        RAIL_HOT_LIMIT,
        tagsByListingId,
      );

      const newestRailIds = new Set(topGrossing.map((l) => l.id));

      const newReleases =
        trendingRaw.length > 0
          ? fillFeaturedRail(
              trendingRaw.filter((l) => !newestRailIds.has(l.id)),
              all.filter((l) => !newestRailIds.has(l.id)),
              RAIL_TRENDING_LIMIT,
              tagsByListingId,
            )
          : await db
              .select()
              .from(listings)
              .where(and(publicCatalogLinkStatus(), newListingPublishedSinceCondition()))
              .orderBy(desc(listingFirstSeenAtExpr()))
              .limit(RAIL_TRENDING_LIMIT);

      const featured = await getFeaturedListings(db);

      return {
        topGrossing,
        newReleases,
        featured,
        all,
        rankingsFromAnalytics: trendingRaw.length > 0,
      };
    },
  );

  if (!result.ok) {
    return { ...result.data, catalogUnavailable: true };
  }
  return result.data;
}

export async function hasAnyListings() {
  const result = await safeCatalogQuery("hasAnyListings", false, async (db) => {
    const [row] = await db.select({ id: listings.id }).from(listings).limit(1);
    return Boolean(row);
  });
  return result.data;
}

export async function getPublishedListingCount() {
  const result = await safeCatalogQuery("getPublishedListingCount", 0, async (db) => {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings);
    return row?.count ?? 0;
  });
  return result.data;
}
