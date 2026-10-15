import { and, desc, asc, isNotNull, sql } from "drizzle-orm";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";
import { listings, type Listing } from "@/db/schema";
import { getHotListings, getRecentPopular } from "@/lib/analytics";
import { getTagSlugsByListingIds } from "@/lib/listing-tags";
import {
  ANALYTICS_RANK_POOL,
  fillFeaturedRail,
  RAIL_HOT_LIMIT,
  RAIL_TRENDING_LIMIT,
} from "@/lib/listings-ranking";
import { safeCatalogQuery } from "@/lib/db-safe";

const emptyStorefront = {
  topGrossing: [] as Listing[],
  newReleases: [] as Listing[],
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

      const hotRaw = await getHotListings(ANALYTICS_RANK_POOL);
      const trendingRaw = await getRecentPopular(ANALYTICS_RANK_POOL);

      const tagListingIds = [
        ...new Set([
          ...all.map((l) => l.id),
          ...hotRaw.map((l) => l.id),
          ...trendingRaw.map((l) => l.id),
        ]),
      ];
      const tagsByListingId = await getTagSlugsByListingIds(db, tagListingIds);

      const topGrossingFromChart = await db
        .select()
        .from(listings)
        .where(and(publicCatalogLinkStatus(), isNotNull(listings.chartRank)))
        .orderBy(asc(listings.chartRank))
        .limit(RAIL_HOT_LIMIT);

      const hotFallback =
        topGrossingFromChart.length > 0
          ? topGrossingFromChart
          : all.slice(0, RAIL_HOT_LIMIT).map((l, i) => ({ ...l, chartRank: i + 1 }));

      const trendingFallback = all
        .filter((l) => l.chartBucket !== "top_grossing")
        .slice(0, RAIL_TRENDING_LIMIT);
      const trendingFallbackOrAll =
        trendingFallback.length > 0 ? trendingFallback : all.slice(0, RAIL_TRENDING_LIMIT);

      const hotSource = hotRaw.length > 0 ? hotRaw : hotFallback;
      const trendingSource = trendingRaw.length > 0 ? trendingRaw : trendingFallbackOrAll;

      const hotIds = new Set(hotSource.map((l) => l.id));
      const trendingBackfillPool = all.filter((l) => !hotIds.has(l.id));

      const topGrossing = fillFeaturedRail(
        hotSource,
        hotFallback,
        RAIL_HOT_LIMIT,
        tagsByListingId,
      ).map((l, i) => ({ ...l, chartRank: l.chartRank ?? i + 1 }));

      const newReleases = fillFeaturedRail(
        trendingSource,
        trendingBackfillPool.length ? trendingBackfillPool : all,
        RAIL_TRENDING_LIMIT,
        tagsByListingId,
      );

      return {
        topGrossing,
        newReleases,
        all,
        rankingsFromAnalytics: hotRaw.length > 0 || trendingRaw.length > 0,
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
