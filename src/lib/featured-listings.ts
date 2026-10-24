import { and, asc, desc, eq } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { listings, type Listing } from "@/db/schema";
import { getHotListings } from "@/lib/analytics";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";
import { getWeeklyRotatedFeaturedHero } from "@/lib/weekly-featured-rotation";

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
 * Priority: env slug → automated weekly rotation → hot engagement → chart_bucket featured.
 */
export async function getFeaturedHeroPick(db: CatalogDb): Promise<FeaturedHeroResult> {
  const fromEnv = featuredListingSlugsFromEnv();
  if (fromEnv[0]) {
    return { listing: await listingForSlug(db, fromEnv[0]), heroSubtitle: null };
  }

  const rotated = await getWeeklyRotatedFeaturedHero(db);
  if (rotated.listing) {
    return rotated;
  }

  const hot = await getHotListings(1);
  if (hot[0]) {
    return {
      listing: hot[0],
      heroSubtitle: "Featured pick from recent community traffic on NSFW Droid.",
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
