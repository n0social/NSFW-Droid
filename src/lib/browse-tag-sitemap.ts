import { eq, max } from "drizzle-orm";
import { listingTags, listings, tags } from "@/db/schema";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";
import { safeCatalogQuery } from "@/lib/db-safe";
import { isNsfwBrowseCatalogTag } from "@/lib/tag-filter";

export type BrowseTagHubSitemapRow = {
  slug: string;
  updatedAt: Date;
};

export async function getBrowseTagHubsForSitemap(): Promise<BrowseTagHubSitemapRow[]> {
  const empty: BrowseTagHubSitemapRow[] = [];
  const result = await safeCatalogQuery("getBrowseTagHubsForSitemap", empty, async (db) => {
    const rows = await db
      .select({
        slug: tags.slug,
        label: tags.label,
        kind: tags.kind,
        updatedAt: max(listings.updatedAt).as("updated_at"),
      })
      .from(tags)
      .innerJoin(listingTags, eq(listingTags.tagId, tags.id))
      .innerJoin(listings, eq(listingTags.listingId, listings.id))
      .where(publicCatalogLinkStatus())
      .groupBy(tags.id, tags.slug, tags.label, tags.kind);

    return rows
      .filter((row) => isNsfwBrowseCatalogTag(row))
      .map((row) => ({
        slug: row.slug,
        updatedAt: row.updatedAt ?? new Date(0),
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  });

  return result.ok ? result.data : empty;
}
