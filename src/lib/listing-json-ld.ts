import type { Listing } from "@/db/schema";
import { displayListingTitle } from "@/lib/listing-display";
import { gameListingPath } from "@/lib/listing-routes";
import { siteUrl } from "@/lib/site";

function schemaTypeForListing(listing: Listing): "VideoGame" | "SoftwareApplication" {
  const plats = (listing.platforms ?? []).map((p) => p.toLowerCase());
  const browserOnly =
    plats.length > 0 && plats.every((p) => p === "browser" || p === "web" || p === "html5");
  return browserOnly ? "SoftwareApplication" : "VideoGame";
}

export function buildListingJsonLd(
  listing: Listing,
  description: string,
): Record<string, unknown> {
  const name = displayListingTitle(listing.title);
  const url = `${siteUrl}${gameListingPath(listing.slug)}`;
  const cover = listing.coverImageUrl?.trim();

  return {
    "@context": "https://schema.org",
    "@type": schemaTypeForListing(listing),
    name,
    description,
    url,
    ...(cover ? { image: cover } : {}),
  };
}
