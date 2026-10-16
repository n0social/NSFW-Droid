import { readFile } from "fs/promises";
import { isItchNsfwOnlyMode } from "../../src/lib/catalog-maturity";

/** Site-wide itch feeds (all genres) — omitted when ITCH_NSFW_ONLY is on (default). */
export const ITCH_GLOBAL_FEEDS = [
  "https://itch.io/feed/new.xml",
  "https://itch.io/feed/featured.xml",
  "https://itch.io/feed/sales.xml",
];

/** Adult-tagged browse feeds — each returns ~36 top items; dedupe by (source, external_id). */
export const ITCH_NSFW_BROWSE_FEEDS = [
  "https://itch.io/games/tag-nsfw.xml",
  "https://itch.io/games/tag-adult.xml",
  "https://itch.io/games/tag-erotic.xml",
  "https://itch.io/games/tag-lewd.xml",
  "https://itch.io/games/tag-hentai.xml",
  "https://itch.io/games/genre-visual-novel/tag-nsfw.xml",
  "https://itch.io/games/platform-windows/tag-nsfw.xml",
  "https://itch.io/games/platform-android/tag-nsfw.xml",
  "https://itch.io/games/price-free/tag-nsfw.xml",
  "https://itch.io/games/platform-linux/tag-nsfw.xml",
  "https://itch.io/games/platform-mac/tag-nsfw.xml",
  "https://itch.io/games/platform-web/tag-nsfw.xml",
  "https://itch.io/games/genre-simulation/tag-nsfw.xml",
  "https://itch.io/games/genre-rpg/tag-nsfw.xml",
  "https://itch.io/games/genre-adventure/tag-nsfw.xml",
  "https://itch.io/games/tag-mature/tag-nsfw.xml",
  "https://itch.io/games/tag-18/tag-nsfw.xml",
  "https://itch.io/games/genre-dating-sim/tag-nsfw.xml",
  "https://itch.io/games/genre-action/tag-nsfw.xml",
  "https://itch.io/games/genre-strategy/tag-nsfw.xml",
  "https://itch.io/games/genre-puzzle/tag-nsfw.xml",
  "https://itch.io/games/tag-yuri/tag-nsfw.xml",
  "https://itch.io/games/tag-yaoi/tag-nsfw.xml",
  "https://itch.io/games/tag-furry/tag-nsfw.xml",
  "https://itch.io/games/tag-dating/tag-nsfw.xml",
  "https://itch.io/games/tag-rpg-maker/tag-nsfw.xml",
  "https://itch.io/games/tag-text-based/tag-nsfw.xml",
  "https://itch.io/games/tag-corruption/tag-nsfw.xml",
  "https://itch.io/games/sale/tag-nsfw.xml",
];

/** itch.io browse/search URLs accept `.xml` RSS (see docs/gaps.md). */
export function itchSearchFeedUrl(query: string): string {
  const q = query.trim();
  if (q.startsWith("http://") || q.startsWith("https://")) {
    return q.endsWith(".xml") ? q : `${q}.xml`;
  }
  return `https://itch.io/games?q=${encodeURIComponent(q)}.xml`;
}

export async function itchSearchSeedFeedUrls(): Promise<string[]> {
  const env = process.env.ITCH_SEARCH_FEED_QUERIES?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  let queries: string[] = env ?? [];
  if (!queries.length) {
    try {
      const raw = await readFile("data/itch-search-feed-queries.json", "utf8");
      queries = JSON.parse(raw) as string[];
    } catch {
      queries = [];
    }
  }
  return queries.map(itchSearchFeedUrl);
}

export async function defaultItchFeedUrls(): Promise<string[]> {
  if (process.env.ITCH_MINIMAL_FEEDS === "1") {
    const nsfwOnly = isItchNsfwOnlyMode();
    return nsfwOnly ? [ITCH_NSFW_BROWSE_FEEDS[0]] : ["https://itch.io/feed/new.xml"];
  }
  const extra = process.env.ITCH_EXTRA_FEED_URLS?.split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  const nsfwOnly = isItchNsfwOnlyMode();
  const includeSiteNew =
    process.env.ITCH_INCLUDE_SITE_NEW_FEED === "1" ||
    (nsfwOnly && process.env.ITCH_INCLUDE_SITE_NEW_FEED !== "0");
  const base = nsfwOnly
    ? [
        ...(includeSiteNew ? [ITCH_GLOBAL_FEEDS[0]] : []),
        ...ITCH_NSFW_BROWSE_FEEDS,
      ]
    : [...ITCH_GLOBAL_FEEDS, ...ITCH_NSFW_BROWSE_FEEDS];
  const seeds = await itchSearchSeedFeedUrls();
  const merged = [...base, ...seeds];
  return extra?.length ? [...merged, ...extra] : merged;
}

export function feedTagsFromUrl(feedUrl: string): string[] {
  const tags: string[] = [];
  const tagMatch = feedUrl.match(/tag-([a-z0-9-]+)/i);
  if (tagMatch) tags.push(normalizeTagSlug(tagMatch[1]));
  if (feedUrl.includes("/feed/new")) tags.push("itch-new");
  if (feedUrl.includes("/feed/featured")) tags.push("itch-featured");
  // No itch-sale / price-free feed tags — store pricing is not shown on the catalog.
  if (feedUrl.includes("platform-windows")) tags.push("windows");
  if (feedUrl.includes("platform-android")) tags.push("android");
  if (feedUrl.includes("genre-visual-novel")) tags.push("visual-novel");
  return tags;
}

export function normalizeTagSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}
