import { and, max, sql } from "drizzle-orm";
import { listings } from "@/db/schema";
import { publicCatalogLinkStatus } from "@/lib/catalog-visibility";
import { safeCatalogQuery } from "@/lib/db-safe";
import { BROWSE_PLATFORM_HUBS } from "@/lib/browse-platforms";

export type BrowsePlatformHubSitemapRow = {
  slug: string;
  updatedAt: Date;
};

function platformMatchSql(slug: string) {
  if (slug === "mac") {
    return sql`( 'mac' = ANY(${listings.platforms}) OR 'macos' = ANY(${listings.platforms}) )`;
  }
  if (slug === "browser") {
    return sql`( 'browser' = ANY(${listings.platforms}) OR 'web' = ANY(${listings.platforms}) OR 'html5' = ANY(${listings.platforms}) )`;
  }
  return sql`${slug} = ANY(${listings.platforms})`;
}

export async function getBrowsePlatformHubsForSitemap(): Promise<BrowsePlatformHubSitemapRow[]> {
  const empty: BrowsePlatformHubSitemapRow[] = [];
  const result = await safeCatalogQuery("getBrowsePlatformHubsForSitemap", empty, async (db) => {
    const rows: BrowsePlatformHubSitemapRow[] = [];
    for (const hub of BROWSE_PLATFORM_HUBS) {
      const match = platformMatchSql(hub.slug);
      const where = and(publicCatalogLinkStatus(), match);

      const [countRow] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(listings)
        .where(where);
      if ((countRow?.n ?? 0) === 0) continue;

      const [row] = await db
        .select({ updatedAt: max(listings.updatedAt).as("updated_at") })
        .from(listings)
        .where(where);

      rows.push({
        slug: hub.slug,
        updatedAt: row?.updatedAt ?? new Date(0),
      });
    }
    return rows;
  });

  return result.ok ? result.data : empty;
}
