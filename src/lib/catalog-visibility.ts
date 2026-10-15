import { and, eq } from "drizzle-orm";
import { listings } from "@/db/schema";

/** Listings shown on home rails, browse, and analytics-backed rankings. */
export const publicCatalogLinkStatus = () =>
  and(eq(listings.linkStatus, "ok"), eq(listings.catalogStale, false));
