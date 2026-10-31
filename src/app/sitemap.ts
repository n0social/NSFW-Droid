import type { MetadataRoute } from "next";
import { getBrowsePlatformHubsForSitemap } from "@/lib/browse-platform-sitemap";
import { getBrowseTagHubsForSitemap } from "@/lib/browse-tag-sitemap";
import { getPublishedListingsForSitemap } from "@/lib/listing-detail";
import { gameListingPath } from "@/lib/listing-routes";
import { siteUrl } from "@/lib/site";
/**
 * Always build the sitemap from the live catalog at request time.
 * A build-time snapshot (no DB) is only static routes and can mask the real URL list
 * or serve stale ISR route-cache entries after deploy.
 */
export const dynamic = "force-dynamic";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: siteUrl, changeFrequency: "daily", priority: 1 },
  { url: `${siteUrl}/browse`, changeFrequency: "daily", priority: 0.9 },
  { url: `${siteUrl}/new`, changeFrequency: "daily", priority: 0.8 },
  { url: `${siteUrl}/videos`, changeFrequency: "hourly", priority: 0.75 },
  { url: `${siteUrl}/creators`, changeFrequency: "weekly", priority: 0.7 },
  { url: `${siteUrl}/creators/assets`, changeFrequency: "weekly", priority: 0.68 },
  { url: `${siteUrl}/creators/tutorials`, changeFrequency: "weekly", priority: 0.67 },
  { url: `${siteUrl}/creators/models`, changeFrequency: "weekly", priority: 0.66 },
  { url: `${siteUrl}/links`, changeFrequency: "weekly", priority: 0.65 },
  { url: `${siteUrl}/submit`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/affiliate`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/dmca`, changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rows, tagHubs, platformHubs] = await Promise.all([
    getPublishedListingsForSitemap(),
    getBrowseTagHubsForSitemap(),
    getBrowsePlatformHubsForSitemap(),
  ]);

  const gameEntries: MetadataRoute.Sitemap = rows.map((row) => ({
    url: `${siteUrl}${gameListingPath(row.slug)}`,
    lastModified: row.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const tagHubEntries: MetadataRoute.Sitemap = tagHubs.map((hub) => ({
    url: `${siteUrl}/browse?tag=${encodeURIComponent(hub.slug)}`,
    lastModified: hub.updatedAt,
    changeFrequency: "weekly",
    priority: 0.62,
  }));

  const platformHubEntries: MetadataRoute.Sitemap = platformHubs.map((hub) => ({
    url: `${siteUrl}/browse?platform=${encodeURIComponent(hub.slug)}`,
    lastModified: hub.updatedAt,
    changeFrequency: "weekly",
    priority: 0.64,
  }));

  return [...STATIC_ROUTES, ...platformHubEntries, ...tagHubEntries, ...gameEntries];
}
