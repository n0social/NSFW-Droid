import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { listings, type Listing } from "@/db/schema";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";

export const FEATURED_RAIL_LIMIT = 12;

export function featuredListingSlugsFromEnv(): string[] {
  const raw = process.env.FEATURED_LISTING_SLUGS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function getFeaturedListings(db: CatalogDb): Promise<Listing[]> {
  const fromEnv = featuredListingSlugsFromEnv();
  if (fromEnv.length > 0) {
    const rows = await db
      .select()
      .from(listings)
      .where(and(publicCatalogLinkStatus(), inArray(listings.slug, fromEnv)));
    const bySlug = new Map(rows.map((r) => [r.slug.toLowerCase(), r]));
    return fromEnv
      .map((slug) => bySlug.get(slug))
      .filter((row): row is Listing => Boolean(row))
      .slice(0, FEATURED_RAIL_LIMIT);
  }

  return db
    .select()
    .from(listings)
    .where(and(publicCatalogLinkStatus(), eq(listings.chartBucket, "featured")))
    .orderBy(asc(listings.chartRank), desc(listings.publishedAt))
    .limit(FEATURED_RAIL_LIMIT);
}
