import { readFileSync } from "fs";
import path from "path";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { listings, type Listing } from "@/db/schema";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";

export const FEATURED_RAIL_LIMIT = 12;

const DATA_PATH = path.join(process.cwd(), "data/featured-listing-slugs.json");

let cachedDataSlugs: string[] | null = null;

export function featuredListingSlugsFromEnv(): string[] {
  const raw = process.env.FEATURED_LISTING_SLUGS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Curated homepage featured rail (first slug = hero). Overridden by `FEATURED_LISTING_SLUGS` env. */
export function featuredListingSlugsFromData(): string[] {
  if (cachedDataSlugs) return cachedDataSlugs;
  try {
    const parsed = JSON.parse(readFileSync(DATA_PATH, "utf8")) as unknown;
    if (!Array.isArray(parsed)) {
      cachedDataSlugs = [];
      return cachedDataSlugs;
    }
    cachedDataSlugs = parsed
      .map((s) => (typeof s === "string" ? s.trim().toLowerCase() : ""))
      .filter(Boolean);
  } catch {
    cachedDataSlugs = [];
  }
  return cachedDataSlugs;
}

async function listingsForSlugOrder(db: CatalogDb, slugOrder: string[]): Promise<Listing[]> {
  if (slugOrder.length === 0) return [];
  const rows = await db
    .select()
    .from(listings)
    .where(and(publicCatalogLinkStatus(), inArray(listings.slug, slugOrder)));
  const bySlug = new Map(rows.map((r) => [r.slug.toLowerCase(), r]));
  return slugOrder
    .map((slug) => bySlug.get(slug))
    .filter((row): row is Listing => Boolean(row))
    .slice(0, FEATURED_RAIL_LIMIT);
}

export async function getFeaturedListings(db: CatalogDb): Promise<Listing[]> {
  const fromEnv = featuredListingSlugsFromEnv();
  if (fromEnv.length > 0) {
    return listingsForSlugOrder(db, fromEnv);
  }

  const fromData = featuredListingSlugsFromData();
  if (fromData.length > 0) {
    return listingsForSlugOrder(db, fromData);
  }

  return db
    .select()
    .from(listings)
    .where(and(publicCatalogLinkStatus(), eq(listings.chartBucket, "featured")))
    .orderBy(asc(listings.chartRank), desc(listings.publishedAt))
    .limit(FEATURED_RAIL_LIMIT);
}
