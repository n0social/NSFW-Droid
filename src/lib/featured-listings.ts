import { and, asc, desc, eq } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { listings, type Listing } from "@/db/schema";
import { getHotListings } from "@/lib/analytics";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";
import {
  featuredListingEnvOverrideActive,
  featuredListingSlugsFromEnv,
} from "@/lib/featured-override";
import { getWeeklyRotatedFeaturedHero } from "@/lib/weekly-featured-rotation";

export type FeaturedHeroResult = {
  listing: Listing | null;
  heroSubtitle: string | null;
};

export { featuredListingSlugsFromEnv } from "@/lib/featured-override";

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
 * Priority: env slug → weekly pick from prior week’s new additions → hot engagement → chart_bucket featured.
 */
export async function getFeaturedHeroPick(db: CatalogDb): Promise<FeaturedHeroResult> {
  if (featuredListingEnvOverrideActive()) {
    const slug = featuredListingSlugsFromEnv()[0];
    if (slug) {
      return { listing: await listingForSlug(db, slug), heroSubtitle: null };
    }
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
