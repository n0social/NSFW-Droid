import { and, eq, inArray, isNotNull, ne, or } from "drizzle-orm";
import { listings } from "@/db/schema";
import {
  coverOptionalListingSlugs,
  getCoverOptionalListingsSync,
} from "@/lib/cover-optional-listings";

/** Non-stale catalog rows (detail pages may still show broken outbound links). */
export const publicCatalogListingRow = () => eq(listings.catalogStale, false);

/** Allowlisted store cover URL (itch RSS / Steam header); not typographic placeholders. */
export const publicCatalogHasCoverArt = () =>
  and(isNotNull(listings.coverImageUrl), ne(listings.coverImageUrl, ""));

/** Store cover, or a curated slug in `data/cover-optional-listings.json`. */
export const publicCatalogCoverOrOverride = () => {
  const slugs = coverOptionalListingSlugs(getCoverOptionalListingsSync());
  if (!slugs.length) return publicCatalogHasCoverArt();
  return or(publicCatalogHasCoverArt(), inArray(listings.slug, slugs));
};

/** Listings shown on home rails, browse, and analytics-backed rankings. */
export const publicCatalogLinkStatus = () =>
  and(
    eq(listings.linkStatus, "ok"),
    publicCatalogListingRow(),
    publicCatalogCoverOrOverride(),
  );
