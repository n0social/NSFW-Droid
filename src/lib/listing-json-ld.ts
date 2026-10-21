import type { Listing, Tag } from "@/db/schema";
import { displayListingTitle } from "@/lib/listing-display";
import { gameListingPath } from "@/lib/listing-routes";
import { siteUrl } from "@/lib/site";

function schemaPlatformLabel(slug: string): string {
  const s = slug.trim().toLowerCase();
  switch (s) {
    case "browser":
    case "web":
    case "html5":
      return "Web browser";
    case "windows":
      return "Windows";
    case "mac":
    case "macos":
      return "macOS";
    case "linux":
      return "Linux";
    case "android":
      return "Android";
    case "ios":
      return "iOS";
    default:
      return slug.trim().charAt(0).toUpperCase() + slug.trim().slice(1);
  }
}

function listingPlatformLabels(listing: Listing): string[] {
  const raw = (listing.platforms ?? []).map((p) => p.trim()).filter(Boolean);
  const labels = raw.map(schemaPlatformLabel);
  return labels.length > 0 ? labels : ["Web browser"];
}

function isBrowserOnlyListing(listing: Listing): boolean {
  const plats = (listing.platforms ?? []).map((p) => p.toLowerCase());
  return plats.length > 0 && plats.every((p) => p === "browser" || p === "web" || p === "html5");
}

function schemaTypeForListing(listing: Listing): "VideoGame" | "SoftwareApplication" {
  return isBrowserOnlyListing(listing) ? "SoftwareApplication" : "VideoGame";
}

function genreFromTags(tags: Tag[]): string | string[] | undefined {
  const genres = tags
    .filter((t) => t.kind.trim().toLowerCase() === "genre")
    .map((t) => t.label.trim())
    .filter(Boolean);
  if (genres.length === 0) return undefined;
  if (genres.length === 1) return genres[0];
  return genres;
}

function keywordsFromTags(tags: Tag[]): string | undefined {
  const labels = tags.map((t) => t.label.trim()).filter(Boolean);
  if (labels.length === 0) return undefined;
  return labels.join(", ");
}

function buildListingNode(
  listing: Listing,
  description: string,
  tags: Tag[],
): Record<string, unknown> {
  const name = displayListingTitle(listing.title);
  const url = `${siteUrl}${gameListingPath(listing.slug)}`;
  const cover = listing.coverImageUrl?.trim();
  const type = schemaTypeForListing(listing);
  const platforms = listingPlatformLabels(listing);
  const genre = genreFromTags(tags);
  const keywords = keywordsFromTags(tags);

  const platformField =
    type === "SoftwareApplication"
      ? { operatingSystem: platforms.length === 1 ? platforms[0] : platforms }
      : { gamePlatform: platforms.length === 1 ? platforms[0] : platforms };

  return {
    "@type": type,
    name,
    description,
    url,
    ...(cover ? { image: cover } : {}),
    ...platformField,
    ...(genre ? { genre } : {}),
    ...(keywords ? { keywords } : {}),
    audience: {
      "@type": "PeopleAudience",
      requiredMinAge: 18,
    },
  };
}

function buildBreadcrumbNode(listing: Listing): Record<string, unknown> {
  const name = displayListingTitle(listing.title);
  const gameUrl = `${siteUrl}${gameListingPath(listing.slug)}`;

  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Browse catalog",
        item: `${siteUrl}/browse`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name,
        item: gameUrl,
      },
    ],
  };
}

/** Single JSON-LD document: listing entity + breadcrumbs (`@graph`). */
export function buildGamePageJsonLd(
  listing: Listing,
  description: string,
  tags: Tag[] = [],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [buildListingNode(listing, description, tags), buildBreadcrumbNode(listing)],
  };
}
