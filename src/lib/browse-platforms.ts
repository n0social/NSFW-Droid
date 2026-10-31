import { siteName } from "@/lib/site";

/** Indexable `/browse?platform=` hub slugs (must match catalog `listing.platforms` values). */
export const BROWSE_PLATFORM_HUBS: { slug: string; label: string; seoTitle: string }[] = [
  { slug: "android", label: "Android", seoTitle: "NSFW games for Android" },
  { slug: "windows", label: "Windows", seoTitle: "NSFW games for Windows" },
  { slug: "mac", label: "Mac", seoTitle: "NSFW games for Mac" },
  { slug: "linux", label: "Linux", seoTitle: "NSFW games for Linux" },
  { slug: "browser", label: "Browser", seoTitle: "NSFW browser games" },
];

const SLUG_SET = new Set(BROWSE_PLATFORM_HUBS.map((p) => p.slug));

export function normalizeBrowsePlatformSlug(raw: string | null | undefined): string | null {
  const s = raw?.trim().toLowerCase() || "";
  if (!s) return null;
  if (s === "macos" || s === "osx") return "mac";
  if (s === "web" || s === "html5") return "browser";
  return SLUG_SET.has(s) ? s : null;
}

export function browsePlatformHubMeta(slug: string) {
  return BROWSE_PLATFORM_HUBS.find((p) => p.slug === slug) ?? null;
}

/** SSR intro for `/browse?platform=` hub pages. */
export function browsePlatformHubIntro(label: string, platformSlug: string, total: number): string {
  const count = Math.max(0, Math.floor(total));
  const countPhrase =
    count === 0
      ? "No catalog titles"
      : count === 1
        ? "1 mature game"
        : `${count.toLocaleString("en-US")} mature games`;

  const platformPhrase =
    platformSlug === "browser"
      ? "playable in the browser"
      : `for ${label}`;

  return `${countPhrase} ${platformPhrase} on ${siteName}. Curated 18+ listings from itch.io, Steam, and partner stores — outbound links to official storefronts only.`;
}
