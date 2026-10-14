import { desc, asc, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { listings, type Listing } from "@/db/schema";
import { getHotListings, getRecentPopular } from "@/lib/analytics";

export async function getListingsForStorefront() {
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
}

export async function hasAnyListings() {
  const [row] = await db.select({ id: listings.id }).from(listings).limit(1);
  return Boolean(row);
}
