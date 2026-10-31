import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { listings, listingTags, tags, type Listing, type Tag } from "@/db/schema";
import { getRecentPopular } from "@/lib/analytics";
import {
  FEATURED_RAIL_NICHE_TAG_SLUGS,
  rankForFeaturedRail,
} from "@/lib/listings-ranking";
import { getTagSlugsByListingIds, listBrowseTags } from "@/lib/listing-tags";
import { safeCatalogQuery } from "@/lib/db-safe";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";
import {
  getRecentNewListings,
  listingFirstSeenAtExpr,
  newListingPublishedSinceCondition,
} from "@/lib/new-listings";
import { listingMatchesBrowsePlatformSlug } from "@/lib/browse-platform-filter";
import { normalizeBrowsePlatformSlug } from "@/lib/browse-platforms";

export type BrowseFilters = {
  rail?: "new" | "trending" | null;
  tag?: string | null;
  platform?: string | null;
  vanilla?: boolean;
  q?: string | null;
  sort?: "new" | null;
  page?: number;
};

export type BrowseResult = {
  listings: Listing[];
  tags: Tag[];
  total: number;
  catalogUnavailable?: boolean;
};

import { BROWSE_PAGE_SIZE } from "@/lib/browse-constants";

export async function getBrowseListings(filters: BrowseFilters): Promise<BrowseResult> {
  const empty: BrowseResult = { listings: [], tags: [], total: 0 };

  const result = await safeCatalogQuery("getBrowseListings", empty, async (db) => {
    const allTags = await listBrowseTags(db);
    const tagSlug = filters.tag?.trim().toLowerCase() || null;
    const platformSlug = normalizeBrowsePlatformSlug(filters.platform);
    const platformSql = platformSlug ? listingMatchesBrowsePlatformSlug(platformSlug) : null;
    const q = filters.q?.trim() || null;
    const vanillaOnly = filters.vanilla === true;
    const sortNew = filters.sort === "new";
    const page = Math.max(1, Math.floor(filters.page ?? 1));
    const offset = (page - 1) * BROWSE_PAGE_SIZE;
    const useFeaturedRanking =
      page === 1 && !tagSlug && !platformSlug && !filters.rail && !q && !sortNew && !vanillaOnly;

    let base: Listing[] = [];

    if (filters.rail === "new") {
      base = await getRecentNewListings(48);
    } else if (filters.rail === "trending") {
      const trending = await getRecentPopular(48);
      base =
        trending.length > 0
          ? trending
          : await db
              .select()
              .from(listings)
              .where(and(publicCatalogLinkStatus(), newListingPublishedSinceCondition()))
              .orderBy(desc(listingFirstSeenAtExpr()))
              .limit(48);
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
              publicCatalogLinkStatus(),
              eq(listingTags.tagId, tagRow.id),
              ...(sortNew ? [newListingPublishedSinceCondition()] : []),
              ...(q ? [ilike(listings.title, `%${q}%`)] : []),
            ),
          )
          .orderBy(desc(sortNew ? listingFirstSeenAtExpr() : listings.publishedAt))
          .limit(BROWSE_PAGE_SIZE)
          .offset(offset);
        base = tagged.map((r) => r.listing);
      } else if (platformSlug && platformSql) {
        const catalogWhere = and(
          publicCatalogLinkStatus(),
          platformSql,
          ...(sortNew ? [newListingPublishedSinceCondition()] : []),
          ...conditions,
        );
        base = await db
          .select()
          .from(listings)
          .where(catalogWhere)
          .orderBy(desc(sortNew ? listingFirstSeenAtExpr() : listings.publishedAt))
          .limit(BROWSE_PAGE_SIZE)
          .offset(offset);
      } else {
        const catalogWhere = and(
          publicCatalogLinkStatus(),
          ...(sortNew ? [newListingPublishedSinceCondition()] : []),
          ...conditions,
        );
        base = await db
          .select()
          .from(listings)
          .where(catalogWhere)
          .orderBy(desc(sortNew ? listingFirstSeenAtExpr() : listings.publishedAt))
          .limit(BROWSE_PAGE_SIZE)
          .offset(offset);
      }
    }

    const ids = base.map((l) => l.id);
    const tagsById = await getTagSlugsByListingIds(db, ids);

    let filtered = base;
    if (vanillaOnly) {
      filtered = base.filter((l) => !listingHasNicheFromMap(tagsById, l.id));
    } else if (useFeaturedRanking) {
      filtered = rankForFeaturedRail(base, tagsById, BROWSE_PAGE_SIZE);
    }

    let countWhere =
      sortNew || filters.rail === "new"
        ? and(publicCatalogLinkStatus(), newListingPublishedSinceCondition())
        : publicCatalogLinkStatus();
    if (tagSlug) {
      const [tagRow] = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, tagSlug)).limit(1);
      if (tagRow) {
        const [tagCount] = await db
          .select({ count: sql<number>`count(distinct ${listings.id})::int` })
          .from(listings)
          .innerJoin(listingTags, eq(listingTags.listingId, listings.id))
          .where(and(publicCatalogLinkStatus(), eq(listingTags.tagId, tagRow.id)));
        return {
          listings: filtered,
          tags: allTags,
          total: tagCount?.count ?? filtered.length,
        };
      }
    }
    if (platformSlug && platformSql) {
      countWhere = and(
        publicCatalogLinkStatus(),
        platformSql,
        ...(sortNew ? [newListingPublishedSinceCondition()] : []),
      );
    }
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(countWhere);

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
