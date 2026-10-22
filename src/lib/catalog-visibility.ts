import { and, eq, inArray, isNotNull, ne, or } from "drizzle-orm";
import { listings } from "@/db/schema";
import {
  coverOptionalListingSlugs,
  coverOptionalOfficialUrls,
  getCoverOptionalListingsSync,
} from "@/lib/cover-optional-listings";

/** Non-stale catalog rows (detail pages may still show broken outbound links). */
export const publicCatalogListingRow = () => eq(listings.catalogStale, false);

/** Allowlisted store cover URL (itch RSS / Steam header); not typographic placeholders. */
export const publicCatalogHasCoverArt = () =>
  and(isNotNull(listings.coverImageUrl), ne(listings.coverImageUrl, ""));

/** Store cover, or a curated row in `data/cover-optional-listings.json`. */
export const publicCatalogCoverOrOverride = () => {
  const entries = getCoverOptionalListingsSync();
  const slugs = coverOptionalListingSlugs(entries);
  const urls = coverOptionalOfficialUrls(entries);
  const branches = [publicCatalogHasCoverArt()];
  if (slugs.length) branches.push(inArray(listings.slug, slugs));
  if (urls.length) branches.push(inArray(listings.officialUrl, urls));
  if (branches.length === 1) return branches[0];
  return or(...branches);
};

/** Listings shown on home rails, browse, and analytics-backed rankings. */
export const publicCatalogLinkStatus = () =>
  and(
    eq(listings.linkStatus, "ok"),
    publicCatalogListingRow(),
    publicCatalogCoverOrOverride(),
  );
