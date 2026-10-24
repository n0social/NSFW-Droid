import { and, asc, desc } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { listings, type Listing } from "@/db/schema";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";
import {
  catalogWeekTimeZone,
  formatCurrentIsoWeekRangeLabel,
  formatPreviousWeekRangeLabel,
  previousWeekFavoriteWindow,
  startOfIsoWeekInTimeZone,
  type PreviousWeekFavoriteWindow,
} from "@/lib/catalog-week";
import {
  listingFirstSeenAtExpr,
  listingFirstSeenInRangeCondition,
} from "@/lib/new-listings";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Stable index 0…n−1 for the ISO week containing `date` (site timezone). */
export function weeklyFeaturedRotationIndex(date: Date, poolLength: number, timeZone?: string): number {
  if (poolLength <= 0) return 0;
  const tz = timeZone ?? catalogWeekTimeZone();
  const weekStart = startOfIsoWeekInTimeZone(date, tz);
  const weekOrdinal = Math.floor(weekStart.getTime() / MS_PER_WEEK);
  return ((weekOrdinal % poolLength) + poolLength) % poolLength;
}

export type WeeklyRotatedFeaturedResult = {
  listing: Listing | null;
  heroSubtitle: string | null;
};

const MAX_NEW_ADDITION_WEEK_LOOKBACK = 4;

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

function weekWindowWeeksBefore(
  base: PreviousWeekFavoriteWindow,
  weeksBack: number,
): PreviousWeekFavoriteWindow {
  const ms = weeksBack * 7 * 24 * 60 * 60 * 1000;
  return {
    statsStart: new Date(base.statsStart.getTime() - ms),
    statsEnd: new Date(base.statsEnd.getTime() - ms),
    timeZone: base.timeZone,
  };
}

/**
 * Homepage hero: one browse-visible game per calendar week (Mon–Sun ET), chosen from
 * the previous week's new catalog additions (first-seen time). If that week had no new
 * titles, walks back up to four earlier weeks. Same pick all week; pool refreshes each Monday.
 */
export async function getWeeklyRotatedFeaturedHero(
  db: CatalogDb,
  now: Date = new Date(),
): Promise<WeeklyRotatedFeaturedResult> {
  const tz = catalogWeekTimeZone();
  const anchor = previousWeekFavoriteWindow(now, tz);

  let sourceWindow = anchor;
  let pool: Listing[] = [];
  for (let weeksBack = 0; weeksBack < MAX_NEW_ADDITION_WEEK_LOOKBACK; weeksBack += 1) {
    sourceWindow = weekWindowWeeksBefore(anchor, weeksBack);
    pool = await newAdditionsInWeek(db, sourceWindow);
    if (pool.length > 0) break;
  }

  if (pool.length === 0) {
    return { listing: null, heroSubtitle: null };
  }

  const index = weeklyFeaturedRotationIndex(now, pool.length, tz);
  const featuredWeek = formatCurrentIsoWeekRangeLabel(now, tz);
  const additionsWeek = formatPreviousWeekRangeLabel(sourceWindow);
  const lookedBack = sourceWindow.statsStart.getTime() !== anchor.statsStart.getTime();
  const additionsPhrase = lookedBack
    ? `recent new additions (${additionsWeek})`
    : `last week's new additions (${additionsWeek})`;

  return {
    listing: pool[index] ?? null,
    heroSubtitle: `Featured game of the week (${featuredWeek}) — a pick from ${additionsPhrase}.`,
  };
}
