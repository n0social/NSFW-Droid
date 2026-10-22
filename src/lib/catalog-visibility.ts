import { and, eq, isNotNull, ne } from "drizzle-orm";
import { listings } from "@/db/schema";

/** Non-stale catalog rows (detail pages may still show broken outbound links). */
export const publicCatalogListingRow = () => eq(listings.catalogStale, false);

/** Allowlisted store cover URL (itch RSS / Steam header); not typographic placeholders. */
export const publicCatalogHasCoverArt = () =>
  and(isNotNull(listings.coverImageUrl), ne(listings.coverImageUrl, ""));

/** Listings shown on home rails, browse, and analytics-backed rankings. */
export const publicCatalogLinkStatus = () =>
  and(
    eq(listings.linkStatus, "ok"),
    publicCatalogListingRow(),
    publicCatalogHasCoverArt(),
  );
