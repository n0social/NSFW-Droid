import { sql, type SQL } from "drizzle-orm";
import { listings } from "@/db/schema";
import { normalizeBrowsePlatformSlug } from "@/lib/browse-platforms";

/** SQL condition: listing supports the browse platform hub slug. */
export function listingMatchesBrowsePlatformSlug(platformSlug: string): SQL | null {
  const slug = normalizeBrowsePlatformSlug(platformSlug);
  if (!slug) return null;
  if (slug === "mac") {
    return sql`( 'mac' = ANY(${listings.platforms}) OR 'macos' = ANY(${listings.platforms}) )`;
  }
  if (slug === "browser") {
    return sql`( 'browser' = ANY(${listings.platforms}) OR 'web' = ANY(${listings.platforms}) OR 'html5' = ANY(${listings.platforms}) )`;
  }
  return sql`${slug} = ANY(${listings.platforms})`;
}
