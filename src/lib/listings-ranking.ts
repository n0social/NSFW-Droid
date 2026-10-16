/**
 * Featured homepage rails only — full catalog and /browse still list every title.
 *
 * Vanilla NSFW (tags like nsfw, adult, erotic without niche slugs) is boosted on rails.
 * Niche tags (futa, femboy, etc.) are deprioritized on rails; they remain searchable via
 * tags and title search. Listings are never deleted for niche tags.
 */
export const FEATURED_RAIL_NICHE_TAG_SLUGS = new Set([
  "futa",
  "femboy",
  "futanari",
  "trap",
]);

/** Tags that signal broad mature catalog fit (not niche). */
export const VANILLA_SIGNAL_TAG_SLUGS = new Set([
  "nsfw",
  "adult",
  "erotic",
  "mature",
  "lewd",
  "hentai",
  "18-plus",
]);

export const RAIL_HOT_LIMIT = 10;
export const RAIL_TRENDING_LIMIT = 12;
/** Pull extra analytics rows before niche deprioritization and backfill. */
export const ANALYTICS_RANK_POOL = 48;

/** Outbound clicks in the last {@link HOT_ENGAGEMENT_DAYS} days + favorites in the same window. */
export const HOT_ENGAGEMENT_DAYS = 7;
export const RANK_WEIGHT_FAVORITE_ON_HOT = 3;
/** 48h listing views, scored by velocity (engagement / √(days in catalog)). */
export const TRENDING_VIEW_HOURS = 48;
export const RANK_WEIGHT_FAVORITE_ON_TRENDING = 2;

export function blendedEngagementScore(
  primaryCount: number,
  favoriteCount: number,
  favoriteWeight: number,
): number {
  return primaryCount + favoriteCount * favoriteWeight;
}

export type EngagementRankRow = {
  listingId: string;
  primary: number;
  favorites: number;
};

export function sortEngagementRows(
  rows: EngagementRankRow[],
  favoriteWeight: number,
): EngagementRankRow[] {
  return [...rows].sort((a, b) => {
    const scoreA = blendedEngagementScore(a.primary, a.favorites, favoriteWeight);
    const scoreB = blendedEngagementScore(b.primary, b.favorites, favoriteWeight);
    if (scoreB !== scoreA) return scoreB - scoreA;
    if (b.primary !== a.primary) return b.primary - a.primary;
    return a.listingId.localeCompare(b.listingId);
  });
}

/** Merge click/view aggregates with favorite counts into one ranked id list. */
export function mergeEngagementSignals(
  primaryRows: { listingId: string | null; count: number }[],
  favoriteByListingId: ReadonlyMap<string, number>,
  favoriteWeight: number,
  limit: number,
): EngagementRankRow[] {
  const byId = new Map<string, EngagementRankRow>();

  for (const row of primaryRows) {
    if (!row.listingId) continue;
    const existing = byId.get(row.listingId) ?? {
      listingId: row.listingId,
      primary: 0,
      favorites: favoriteByListingId.get(row.listingId) ?? 0,
    };
    existing.primary += row.count;
    byId.set(row.listingId, existing);
  }

  for (const [listingId, favCount] of favoriteByListingId) {
    if (!byId.has(listingId) && favCount > 0) {
      byId.set(listingId, { listingId, primary: 0, favorites: favCount });
    }
  }

  return sortEngagementRows([...byId.values()], favoriteWeight).slice(0, limit);
}

/** Momentum score: recent engagement divided by √(days since first catalog appearance). */
export function trendingVelocityScore(
  views: number,
  favorites: number,
  favoriteWeight: number,
  firstSeenAt: Date,
  now = new Date(),
): number {
  const ms = Math.max(0, now.getTime() - firstSeenAt.getTime());
  const daysInCatalog = Math.max(1, ms / (24 * 60 * 60 * 1000));
  const engagement = blendedEngagementScore(views, favorites, favoriteWeight);
  return engagement / Math.sqrt(daysInCatalog);
}

export function sortTrendingVelocityRows(
  rows: EngagementRankRow[],
  firstSeenAtByListingId: ReadonlyMap<string, Date>,
  favoriteWeight: number,
  now = new Date(),
): EngagementRankRow[] {
  return [...rows].sort((a, b) => {
    const seenA = firstSeenAtByListingId.get(a.listingId) ?? now;
    const seenB = firstSeenAtByListingId.get(b.listingId) ?? now;
    const scoreA = trendingVelocityScore(a.primary, a.favorites, favoriteWeight, seenA, now);
    const scoreB = trendingVelocityScore(b.primary, b.favorites, favoriteWeight, seenB, now);
    if (scoreB !== scoreA) return scoreB - scoreA;
    if (b.primary !== a.primary) return b.primary - a.primary;
    return a.listingId.localeCompare(b.listingId);
  });
}

export function listingHasNicheTag(tagSlugs: readonly string[]): boolean {
  return tagSlugs.some((s) => FEATURED_RAIL_NICHE_TAG_SLUGS.has(s));
}

export function featuredRailScore(tagSlugs: readonly string[]): number {
  let score = 0;
  if (tagSlugs.some((s) => VANILLA_SIGNAL_TAG_SLUGS.has(s))) score += 2;
  if (listingHasNicheTag(tagSlugs)) score -= 10;
  return score;
}

type WithId = { id: string };

/**
 * Re-order a list for featured rails: vanilla first, niche last, stable within equal scores.
 */
export function rankForFeaturedRail<T extends WithId>(
  items: readonly T[],
  tagsByListingId: ReadonlyMap<string, readonly string[]>,
  limit: number,
): T[] {
  if (limit <= 0 || items.length === 0) return [];

  const scored = items.map((item, idx) => ({
    item,
    idx,
    score: featuredRailScore(tagsByListingId.get(item.id) ?? []),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.idx - b.idx;
  });

  const vanillaFirst = scored.filter((s) => !listingHasNicheTag(tagsByListingId.get(s.item.id) ?? []));
  const pool = vanillaFirst.length >= Math.min(limit, scored.length) ? vanillaFirst : scored;

  return pool.slice(0, limit).map((s) => s.item);
}

/**
 * Fill a rail to `limit` using ranked primary results, then ranked fallback (no duplicate ids).
 */
export function fillFeaturedRail<T extends WithId>(
  primary: readonly T[],
  fallback: readonly T[],
  limit: number,
  tagsByListingId: ReadonlyMap<string, readonly string[]>,
): T[] {
  const rankedPrimary = rankForFeaturedRail(primary, tagsByListingId, limit);
  if (rankedPrimary.length >= limit) return rankedPrimary;

  const seen = new Set(rankedPrimary.map((l) => l.id));
  const extras = fallback.filter((l) => !seen.has(l.id));
  const rankedExtras = rankForFeaturedRail(extras, tagsByListingId, limit - rankedPrimary.length);
  return [...rankedPrimary, ...rankedExtras];
}
