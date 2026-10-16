import { and, desc, sql } from "drizzle-orm";
import { listings, type Listing } from "@/db/schema";
import { safeCatalogQuery } from "@/lib/db-safe";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";

export const NEW_HERO_LIMIT = 10;
export const NEW_MORE_LIMIT = 30;

const DEFAULT_NEW_LISTING_MAX_AGE_DAYS = 30;

/** Catalog titles count as "new" when published within this many days (env override). */
export function getNewListingMaxAgeDays(): number {
  const raw = process.env.NEW_LISTING_MAX_AGE_DAYS?.trim();
  if (!raw) return DEFAULT_NEW_LISTING_MAX_AGE_DAYS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_NEW_LISTING_MAX_AGE_DAYS;
  return n;
}

export function getNewListingCutoffDate(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - getNewListingMaxAgeDays());
  return cutoff;
}

/** First time the listing entered the catalog (`first_seen_at`), not recycle `published_at` bumps. */
export function listingFirstSeenAtExpr() {
  return sql`coalesce(${listings.firstSeenAt}, ${listings.publishedAt})`;
}

/** Drizzle condition: listing first appeared within the new-arrivals window. */
export function newListingPublishedSinceCondition(now = new Date()) {
  const cutoff = getNewListingCutoffDate(now);
  return sql`${listingFirstSeenAtExpr()} >= ${cutoff}`;
}

const emptyNewPage = {
  hero: [] as Listing[],
  more: [] as Listing[],
};

export type NewArrivalsPageData = typeof emptyNewPage & {
  catalogUnavailable?: boolean;
};

export async function getNewArrivalsPageData(): Promise<NewArrivalsPageData> {
  const result = await safeCatalogQuery("getNewArrivalsPageData", emptyNewPage, async (db) => {
    const rows = await db
      .select()
      .from(listings)
      .where(and(publicCatalogLinkStatus(), newListingPublishedSinceCondition()))
      .orderBy(desc(listingFirstSeenAtExpr()))
      .limit(NEW_HERO_LIMIT + NEW_MORE_LIMIT);

    return {
      hero: rows.slice(0, NEW_HERO_LIMIT),
      more: rows.slice(NEW_HERO_LIMIT),
    };
  });

  if (!result.ok) {
    return { ...result.data, catalogUnavailable: true };
  }
  return result.data;
}

/** Homepage / browse rails: recent first-seen titles only (no stale-recycle bumps). */
export async function getRecentNewListings(limit: number): Promise<Listing[]> {
  const result = await safeCatalogQuery("getRecentNewListings", [] as Listing[], async (db) => {
    return db
      .select()
      .from(listings)
      .where(and(publicCatalogLinkStatus(), newListingPublishedSinceCondition()))
      .orderBy(desc(listingFirstSeenAtExpr()))
      .limit(limit);
  });
  return result.data;
}

export async function countNewListingsInWindow(): Promise<number> {
  const result = await safeCatalogQuery("countNewListingsInWindow", 0, async (db) => {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(and(publicCatalogLinkStatus(), newListingPublishedSinceCondition()));
    return row?.count ?? 0;
  });
  return result.data;
}
