import { and, eq } from "drizzle-orm";
import { listings } from "@/db/schema";

/** Non-stale catalog rows (detail pages may still show broken outbound links). */
export const publicCatalogListingRow = () => eq(listings.catalogStale, false);

/** Listings shown on home rails, browse, and analytics-backed rankings. */
export const publicCatalogLinkStatus = () =>
  and(eq(listings.linkStatus, "ok"), publicCatalogListingRow());
