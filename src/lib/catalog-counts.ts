import { and, eq, sql } from "drizzle-orm";
import { candidates, listings } from "@/db/schema";
import { BROWSE_PAGE_SIZE } from "@/lib/browse-constants";
import { safeCatalogQuery } from "@/lib/db-safe";

const liveListingCondition = () =>
  and(eq(listings.linkStatus, "ok"), eq(listings.catalogStale, false));

/** Counts that explain storefront vs raw DB / ingest summaries. */
export type CatalogCountSnapshot = {
  /** Same filter as home header, browse pagination total, and sitemap game URLs. */
  displayedCount: number;
  /** All rows in `listing` (ingest JSON `catalog.listings` uses this). */
  listingsTotal: number;
  staleListings: number;
  /** Not stale but `link_status` ≠ ok — hidden from browse/home. */
  brokenLinkListings: number;
  candidatesTotal: number;
  candidatesPending: number;
  browsePageSize: number;
  browsePageCount: number;
};

const emptySnapshot: CatalogCountSnapshot = {
  displayedCount: 0,
  listingsTotal: 0,
  staleListings: 0,
  brokenLinkListings: 0,
  candidatesTotal: 0,
  candidatesPending: 0,
  browsePageSize: BROWSE_PAGE_SIZE,
  browsePageCount: 0,
};

export async function getCatalogCountSnapshot(): Promise<CatalogCountSnapshot> {
  const result = await safeCatalogQuery("getCatalogCountSnapshot", emptySnapshot, async (db) => {
    const [listingRow] = await db
      .select({
        listingsTotal: sql<number>`count(*)::int`,
        displayedCount: sql<number>`count(*) filter (where ${liveListingCondition()})::int`,
        staleListings: sql<number>`count(*) filter (where ${listings.catalogStale} = true)::int`,
        brokenLinkListings: sql<number>`count(*) filter (where ${listings.catalogStale} = false and ${listings.linkStatus} <> 'ok')::int`,
      })
      .from(listings);

    const [candidateRow] = await db
      .select({
        candidatesTotal: sql<number>`count(*)::int`,
        candidatesPending: sql<number>`count(*) filter (where ${candidates.reviewStatus} = 'pending')::int`,
      })
      .from(candidates);

    const displayed = listingRow?.displayedCount ?? 0;

    return {
      displayedCount: displayed,
      listingsTotal: listingRow?.listingsTotal ?? 0,
      staleListings: listingRow?.staleListings ?? 0,
      brokenLinkListings: listingRow?.brokenLinkListings ?? 0,
      candidatesTotal: candidateRow?.candidatesTotal ?? 0,
      candidatesPending: candidateRow?.candidatesPending ?? 0,
      browsePageSize: BROWSE_PAGE_SIZE,
      browsePageCount: displayed > 0 ? Math.ceil(displayed / BROWSE_PAGE_SIZE) : 0,
    };
  });

  return result.data;
}
