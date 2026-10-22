import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { listings, type Listing } from "@/db/schema";
import { getHotListings } from "@/lib/analytics";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";
import { getWeeklyFeaturedByFavorites } from "@/lib/weekly-featured";

export type FeaturedHeroResult = {
  listing: Listing | null;
  heroSubtitle: string | null;
};

export function featuredListingSlugsFromEnv(): string[] {
  const raw = process.env.FEATURED_LISTING_SLUGS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function listingForSlug(db: CatalogDb, slug: string): Promise<Listing | null> {
  const [row] = await db
    .select()
    .from(listings)
    .where(and(publicCatalogLinkStatus(), eq(listings.slug, slug)))
    .limit(1);
  return row ?? null;
}

/**
 * Single homepage hero featured pick (no carousel rail).
 * Priority: env slug → last week's top ♡ → hot engagement rail algorithm → chart_bucket featured.
 */
export async function getFeaturedHeroPick(db: CatalogDb): Promise<FeaturedHeroResult> {
  const fromEnv = featuredListingSlugsFromEnv();
  if (fromEnv[0]) {
    return { listing: await listingForSlug(db, fromEnv[0]), heroSubtitle: null };
  }

  const weekly = await getWeeklyFeaturedByFavorites(db, 1);
  if (weekly.listings[0]) {
    return { listing: weekly.listings[0], heroSubtitle: weekly.heroSubtitle };
  }

  const hot = await getHotListings(1);
  if (hot[0]) {
    return {
      listing: hot[0],
      heroSubtitle: "Featured pick from this week's community traffic on NSFW Droid.",
    };
  }

  const [fromChart] = await db
    .select()
    .from(listings)
    .where(and(publicCatalogLinkStatus(), eq(listings.chartBucket, "featured")))
    .orderBy(asc(listings.chartRank), desc(listings.publishedAt))
    .limit(1);

  return { listing: fromChart ?? null, heroSubtitle: null };
}
