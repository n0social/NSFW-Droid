import { and, asc, desc, eq, ilike, isNotNull, sql } from "drizzle-orm";
import { listings, listingTags, tags, type Listing, type Tag } from "@/db/schema";
import { getHotListings, getRecentPopular } from "@/lib/analytics";
import {
  FEATURED_RAIL_NICHE_TAG_SLUGS,
  rankForFeaturedRail,
} from "@/lib/listings-ranking";
import { getTagSlugsByListingIds, listBrowseTags } from "@/lib/listing-tags";
import { safeCatalogQuery } from "@/lib/db-safe";

export type BrowseFilters = {
  rail?: "hot" | "trending" | null;
  tag?: string | null;
  vanilla?: boolean;
  q?: string | null;
};

export type BrowseResult = {
  listings: Listing[];
  tags: Tag[];
  total: number;
  catalogUnavailable?: boolean;
};

const BROWSE_PAGE_LIMIT = 120;

export async function getBrowseListings(filters: BrowseFilters): Promise<BrowseResult> {
  const empty: BrowseResult = { listings: [], tags: [], total: 0 };

  const result = await safeCatalogQuery("getBrowseListings", empty, async (db) => {
    const allTags = await listBrowseTags(db);
    const tagSlug = filters.tag?.trim().toLowerCase() || null;
    const q = filters.q?.trim() || null;
    const vanillaOnly = filters.vanilla === true;

    let base: Listing[] = [];

    if (filters.rail === "hot") {
      const hot = await getHotListings(48);
      base = hot.length > 0
        ? hot
        : await db
            .select()
            .from(listings)
            .where(isNotNull(listings.chartRank))
            .orderBy(asc(listings.chartRank))
            .limit(48);
    } else if (filters.rail === "trending") {
      const trending = await getRecentPopular(48);
      base =
        trending.length > 0
          ? trending
          : await db.select().from(listings).orderBy(desc(listings.publishedAt)).limit(48);
    } else {
      const conditions = [];
      if (q) {
        conditions.push(ilike(listings.title, `%${q}%`));
      }
      if (tagSlug) {
        const [tagRow] = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, tagSlug)).limit(1);
        if (!tagRow) {
          return { listings: [], tags: allTags, total: 0 };
        }
        const tagged = await db
          .select({ listing: listings })
          .from(listings)
          .innerJoin(listingTags, eq(listingTags.listingId, listings.id))
          .where(
            and(
              eq(listingTags.tagId, tagRow.id),
              ...(q ? [ilike(listings.title, `%${q}%`)] : []),
            ),
          )
          .orderBy(desc(listings.publishedAt))
          .limit(BROWSE_PAGE_LIMIT);
        base = tagged.map((r) => r.listing);
      } else {
        base = await db
          .select()
          .from(listings)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(listings.publishedAt))
          .limit(BROWSE_PAGE_LIMIT);
      }
    }

    const ids = base.map((l) => l.id);
    const tagsById = await getTagSlugsByListingIds(db, ids);

    let filtered = base;
    if (vanillaOnly) {
      filtered = base.filter((l) => !listingHasNicheFromMap(tagsById, l.id));
    } else if (!tagSlug && !filters.rail && !q) {
      filtered = rankForFeaturedRail(base, tagsById, BROWSE_PAGE_LIMIT);
    }

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings);

    return {
      listings: filtered,
      tags: allTags,
      total: countRow?.count ?? filtered.length,
    };
  });

  if (!result.ok) {
    return { ...result.data, catalogUnavailable: true };
  }
  return result.data;
}

function listingHasNicheFromMap(map: Map<string, string[]>, listingId: string): boolean {
  const slugs = map.get(listingId) ?? [];
  return slugs.some((s) => FEATURED_RAIL_NICHE_TAG_SLUGS.has(s));
}
