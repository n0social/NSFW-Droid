import { and, asc, desc } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { listings, type Listing } from "@/db/schema";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";
import {
  catalogWeekTimeZone,
  formatCurrentIsoWeekRangeLabel,
  formatPreviousWeekRangeLabel,
  previousWeekFavoriteWindow,
  type PreviousWeekFavoriteWindow,
} from "@/lib/catalog-week";
import {
  listingFirstSeenAtExpr,
  listingFirstSeenInRangeCondition,
} from "@/lib/new-listings";

export type WeeklyRotatedFeaturedResult = {
  listing: Listing | null;
  heroSubtitle: string | null;
};

async function newAdditionsInWeek(
  db: CatalogDb,
  window: Pick<PreviousWeekFavoriteWindow, "statsStart" | "statsEnd">,
): Promise<Listing[]> {
  return db
    .select()
    .from(listings)
    .where(and(publicCatalogLinkStatus(), listingFirstSeenInRangeCondition(window.statsStart, window.statsEnd)))
    .orderBy(desc(listingFirstSeenAtExpr()), asc(listings.slug));
}

/**
 * Homepage hero: one title per calendar week (Mon–Sun ET) — the newest browse-visible
 * listing first seen during the **previous** calendar week. Next Monday, repeat for that
 * new “previous week.” No multi-week lookback; hot/chart fallbacks apply when ingest was quiet.
 */
export async function getWeeklyRotatedFeaturedHero(
  db: CatalogDb,
  now: Date = new Date(),
): Promise<WeeklyRotatedFeaturedResult> {
  const tz = catalogWeekTimeZone();
  const sourceWindow = previousWeekFavoriteWindow(now, tz);
  const pool = await newAdditionsInWeek(db, sourceWindow);

  if (pool.length === 0) {
    return { listing: null, heroSubtitle: null };
  }

  const featuredWeek = formatCurrentIsoWeekRangeLabel(now, tz);
  const additionsWeek = formatPreviousWeekRangeLabel(sourceWindow);

  return {
    listing: pool[0] ?? null,
    heroSubtitle: `Featured game of the week (${featuredWeek}) — newest addition from last week (${additionsWeek}).`,
  };
}
