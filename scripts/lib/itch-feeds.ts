/** Default itch.io RSS feeds when ITCH_FEED_URLS is unset (see docs/how_we_get_links.md). */
export const ITCH_GLOBAL_FEEDS = [
  "https://itch.io/feed/new.xml",
  "https://itch.io/feed/featured.xml",
  "https://itch.io/feed/sales.xml",
];

/** Tag/genre browse feeds — each returns ~36 top items; dedupe by (source, external_id). */
export const ITCH_NSFW_BROWSE_FEEDS = [
  "https://itch.io/games/tag-nsfw.xml",
  "https://itch.io/games/tag-adult.xml",
  "https://itch.io/games/tag-erotic.xml",
  "https://itch.io/games/tag-lewd.xml",
  "https://itch.io/games/tag-hentai.xml",
  "https://itch.io/games/tag-dating-sim.xml",
  "https://itch.io/games/tag-dating.xml",
  "https://itch.io/games/tag-visual-novel.xml",
  "https://itch.io/games/genre-visual-novel/tag-nsfw.xml",
  "https://itch.io/games/platform-windows/tag-nsfw.xml",
  "https://itch.io/games/platform-android/tag-nsfw.xml",
  "https://itch.io/games/price-free/tag-nsfw.xml",
];

export function defaultItchFeedUrls(): string[] {
  if (process.env.ITCH_MINIMAL_FEEDS === "1") {
    return ["https://itch.io/feed/new.xml"];
  }
  const extra = process.env.ITCH_EXTRA_FEED_URLS?.split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  const base = [...ITCH_GLOBAL_FEEDS, ...ITCH_NSFW_BROWSE_FEEDS];
  return extra?.length ? [...base, ...extra] : base;
}

export function feedTagsFromUrl(feedUrl: string): string[] {
  const tags: string[] = [];
  const tagMatch = feedUrl.match(/tag-([a-z0-9-]+)/i);
  if (tagMatch) tags.push(normalizeTagSlug(tagMatch[1]));
  if (feedUrl.includes("/feed/new")) tags.push("itch-new");
  if (feedUrl.includes("/feed/featured")) tags.push("itch-featured");
  if (feedUrl.includes("/feed/sales")) tags.push("itch-sale");
  if (feedUrl.includes("price-free")) tags.push("free");
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
