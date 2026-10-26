import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { listings, listingTags, tags, type Listing, type Tag } from "@/db/schema";
import {
  publicCatalogCoverOrOverride,
  publicCatalogLinkStatus,
  publicCatalogListingRow,
} from "@/lib/catalog-visibility";
import { safeCatalogQuery } from "@/lib/db-safe";
import { displayListingTitle } from "@/lib/listing-display";
import { filterTagsForBrowseDisplay } from "@/lib/tag-filter";
import { isListingSlugSafeForPublicUrl } from "@/lib/listing-routes";
import { listingSynopsisForSeo } from "@/lib/listing-store-description";

export async function getPublishedListingBySlug(slug: string): Promise<Listing | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;

  const result = await safeCatalogQuery("getPublishedListingBySlug", null, async (db) => {
    const [row] = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.slug, trimmed),
          publicCatalogListingRow(),
          publicCatalogCoverOrOverride(),
        ),
      )
      .limit(1);
    return row ?? null;
  });

  return result.data;
}

export async function getSimilarListings(listingId: string, limit = 6): Promise<Listing[]> {
  const cap = Math.min(6, Math.max(1, limit));

  const result = await safeCatalogQuery("getSimilarListings", [], async (db) => {
    const tagRows = await db
      .select({ tagId: listingTags.tagId })
      .from(listingTags)
      .where(eq(listingTags.listingId, listingId));
    const tagIds = tagRows.map((r) => r.tagId);
    if (tagIds.length === 0) return [];

    const scored = await db
      .select({ listing: listings })
      .from(listingTags)
      .innerJoin(listings, eq(listings.id, listingTags.listingId))
      .where(
        and(
          inArray(listingTags.tagId, tagIds),
          ne(listings.id, listingId),
          publicCatalogLinkStatus(),
        ),
      )
      .groupBy(listings.id)
      .orderBy(desc(sql`count(*)`), desc(listings.publishedAt))
      .limit(cap);

    return scored.map((r) => r.listing);
  });

  return result.data;
}

export async function getTagsForListingDetail(listingId: string): Promise<Tag[]> {
  const result = await safeCatalogQuery("getTagsForListingDetail", [], async (db) => {
    const rows = await db
      .select({ tag: tags })
      .from(listingTags)
      .innerJoin(tags, eq(listingTags.tagId, tags.id))
      .where(eq(listingTags.listingId, listingId))
      .orderBy(asc(tags.label));
    return filterTagsForBrowseDisplay(rows.map((r) => r.tag));
  });
  return result.data;
}

export type ListingSitemapRow = { slug: string; updatedAt: Date };

export async function getPublishedListingsForSitemap(): Promise<ListingSitemapRow[]> {
  const result = await safeCatalogQuery("getPublishedListingsForSitemap", [], async (db) => {
    return db
      .select({ slug: listings.slug, updatedAt: listings.updatedAt })
      .from(listings)
      .where(publicCatalogLinkStatus());
  });
  return result.data.filter((row) => isListingSlugSafeForPublicUrl(row.slug));
}

function storeLabel(source: Listing["source"]): string {
  switch (source) {
    case "steam":
      return "Steam";
    case "manual":
      return "a curated store";
    case "developer_form":
      return "the developer's store";
    case "affiliate_export":
      return "a partner store";
    default:
      return "itch.io";
  }
}

/** SEO meta description — no store pricing; points to outbound play link. */
export function listingMetaDescription(
  listing: Listing,
  tagLabels: string[] = [],
): string {
  const title = displayListingTitle(listing.title);
  const plats = (listing.platforms ?? []).filter(Boolean);
  const platformPhrase =
    plats.length > 0 ? ` for ${plats.slice(0, 4).join(", ")}` : "";
  const tagPhrase =
    tagLabels.length > 0
      ? ` Tags: ${tagLabels.slice(0, 6).join(", ")}.`
      : "";
  const template = `${title}${platformPhrase} — mature game on ${storeLabel(listing.source)}. Open the official store page from NSFW Droid (18+ catalog).${tagPhrase}`;
  return listingSynopsisForSeo(listing, template);
}
