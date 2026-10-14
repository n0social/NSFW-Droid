import { desc, asc, isNotNull, sql } from "drizzle-orm";
import { listings, type Listing } from "@/db/schema";
import { getHotListings, getRecentPopular } from "@/lib/analytics";
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
        .orderBy(desc(listings.publishedAt))
        .limit(48);

      const hot = await getHotListings(10);
      const trending = await getRecentPopular(12);

      const topGrossingFromChart = await db
        .select()
        .from(listings)
        .where(isNotNull(listings.chartRank))
        .orderBy(asc(listings.chartRank))
        .limit(10);

      const topGrossing: Listing[] =
        hot.length > 0
          ? hot
          : topGrossingFromChart.length > 0
            ? topGrossingFromChart
            : all.slice(0, 8).map((l, i) => ({ ...l, chartRank: i + 1 }));

      const newReleases: Listing[] =
        trending.length > 0
          ? trending
          : all.filter((l) => l.chartBucket !== "top_grossing").slice(0, 12);

      return {
        topGrossing,
        newReleases: newReleases.length ? newReleases : all.slice(0, 12),
        all,
        rankingsFromAnalytics: hot.length > 0 || trending.length > 0,
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
