import { asc } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { listings, type Listing } from "@/db/schema";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";
import {
  catalogWeekTimeZone,
  formatCurrentIsoWeekRangeLabel,
  startOfIsoWeekInTimeZone,
} from "@/lib/catalog-week";

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

/**
 * Homepage hero: one catalog game per calendar week (Mon–Sun ET), rotating through
 * all browse-visible listings in stable slug order. Same game all week; advances each Monday.
 */
export async function getWeeklyRotatedFeaturedHero(
  db: CatalogDb,
  now: Date = new Date(),
): Promise<WeeklyRotatedFeaturedResult> {
  const tz = catalogWeekTimeZone();
  const pool = await db
    .select()
    .from(listings)
    .where(publicCatalogLinkStatus())
    .orderBy(asc(listings.slug));

  if (pool.length === 0) {
    return { listing: null, heroSubtitle: null };
  }

  const index = weeklyFeaturedRotationIndex(now, pool.length, tz);
  const range = formatCurrentIsoWeekRangeLabel(now, tz);
  return {
    listing: pool[index] ?? null,
    heroSubtitle: `Featured game of the week (${range}).`,
  };
}
