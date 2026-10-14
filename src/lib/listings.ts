import { desc, asc, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { listings, type Listing } from "@/db/schema";

export async function getListingsForStorefront() {
  const all = await db
    .select()
    .from(listings)
    .orderBy(desc(listings.publishedAt))
    .limit(48);

  const topGrossing = await db
    .select()
    .from(listings)
    .where(isNotNull(listings.chartRank))
    .orderBy(asc(listings.chartRank))
    .limit(10);

  const newReleases = all
    .filter((l) => l.chartBucket !== "top_grossing")
    .slice(0, 12);

  const top: Listing[] =
    topGrossing.length > 0
      ? topGrossing
      : all.slice(0, 8).map((l, i) => ({ ...l, chartRank: i + 1 }));

  return {
    topGrossing: top,
    newReleases: newReleases.length ? newReleases : all.slice(0, 12),
    all,
  };
}

export async function hasAnyListings() {
  const [row] = await db.select({ id: listings.id }).from(listings).limit(1);
  return Boolean(row);
}
