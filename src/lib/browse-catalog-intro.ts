import { siteName } from "@/lib/site";

/** Default SSR intro on `/browse` (no tag/platform filters). */
export function browseCatalogDefaultIntro(): string {
  return `Browse the full ${siteName} catalog — curated NSFW games for Android, Windows, Mac, Linux, and browser. Filter by tag or platform, or search by title. Every listing links out to the official itch.io or Steam store page.`;
}
