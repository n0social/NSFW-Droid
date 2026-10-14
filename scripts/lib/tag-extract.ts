import { feedTagsFromUrl, normalizeTagSlug } from "./itch-feeds";

export type ExtractedTag = { slug: string; label: string; kind: string };

const TITLE_BRACKET_RE = /\[([^\]]+)\]/g;

const PLATFORM_SLUGS = new Set([
  "windows",
  "macos",
  "linux",
  "android",
  "browser",
  "html",
]);

const KEYWORD_TAGS: { re: RegExp; slug: string; label: string }[] = [
  { re: /\bnsfw\b/i, slug: "nsfw", label: "NSFW" },
  { re: /\b18\+\b/, slug: "18-plus", label: "18+" },
  { re: /\bhentai\b/i, slug: "hentai", label: "Hentai" },
  { re: /\bvisual novel\b/i, slug: "visual-novel", label: "Visual Novel" },
  { re: /\bdating sim\b/i, slug: "dating-sim", label: "Dating Sim" },
  { re: /\bharem\b/i, slug: "harem", label: "Harem" },
  { re: /\bsandbox\b/i, slug: "sandbox", label: "Sandbox" },
  { re: /\bsimulation\b/i, slug: "simulation", label: "Simulation" },
  { re: /\bfemboy\b/i, slug: "femboy", label: "Femboy" },
  { re: /\bfuta\b/i, slug: "futa", label: "Futa" },
];

function labelFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function addTag(map: Map<string, ExtractedTag>, slug: string, kind: string) {
  const s = normalizeTagSlug(slug);
  if (!s || s.length < 2) return;
  if (!map.has(s)) {
    map.set(s, { slug: s, label: labelFromSlug(s), kind });
  }
}

export function extractItchItemTags(
  item: Record<string, unknown>,
  feedUrl: string,
): ExtractedTag[] {
  const map = new Map<string, ExtractedTag>();
  const title = String(item.title ?? item.plainTitle ?? "");

  for (const slug of feedTagsFromUrl(feedUrl)) {
    addTag(map, slug, "feed");
  }

  let m: RegExpExecArray | null;
  TITLE_BRACKET_RE.lastIndex = 0;
  while ((m = TITLE_BRACKET_RE.exec(title))) {
    const raw = m[1].trim();
    if (/^\$|USD|free/i.test(raw)) continue;
    const lower = raw.toLowerCase();
    if (lower === "free") {
      addTag(map, "free", "meta");
      continue;
    }
    if (PLATFORM_SLUGS.has(lower) || lower === "osx") {
      addTag(map, lower === "osx" ? "macos" : lower === "html" ? "browser" : lower, "platform");
      continue;
    }
    addTag(map, raw, "genre");
  }

  const platforms = item.platforms as Record<string, string> | undefined;
  if (platforms) {
    if (platforms.windows === "yes") addTag(map, "windows", "platform");
    if (platforms.osx === "yes") addTag(map, "macos", "platform");
    if (platforms.linux === "yes") addTag(map, "linux", "platform");
    if (platforms.android === "yes") addTag(map, "android", "platform");
    if (platforms.html === "yes") addTag(map, "browser", "platform");
  }

  const desc = String(item.description ?? "");
  const text = `${title} ${desc}`;
  for (const { re, slug, label } of KEYWORD_TAGS) {
    if (re.test(text)) {
      map.set(slug, { slug, label, kind: "keyword" });
    }
  }

  return [...map.values()];
}

export function itchPlatformsFromItem(item: Record<string, unknown>): string[] {
  const platforms = item.platforms as Record<string, string> | undefined;
  const out: string[] = [];
  if (platforms?.windows === "yes") out.push("windows");
  if (platforms?.osx === "yes") out.push("macos");
  if (platforms?.linux === "yes") out.push("linux");
  if (platforms?.android === "yes") out.push("android");
  if (platforms?.html === "yes") out.push("browser");
  return out.length ? out : ["browser"];
}

type SteamPayload = {
  genres?: { description?: string }[];
  categories?: { description?: string }[];
  content_descriptors?: { ids?: number[] };
  short_description?: string;
  name?: string;
};

export function extractSteamTags(raw: SteamPayload | null | undefined): ExtractedTag[] {
  if (!raw) return [];
  const map = new Map<string, ExtractedTag>();
  addTag(map, "steam", "source");

  for (const g of raw.genres ?? []) {
    if (g.description) addTag(map, g.description, "genre");
  }
  for (const c of raw.categories ?? []) {
    if (c.description) addTag(map, c.description, "category");
  }

  const ids = raw.content_descriptors?.ids ?? [];
  if (ids.includes(3)) addTag(map, "adult-only-sexual", "content");
  if (ids.includes(1)) addTag(map, "sexual-content", "content");

  const text = `${raw.name ?? ""} ${raw.short_description ?? ""}`;
  for (const { re, slug, label } of KEYWORD_TAGS) {
    if (re.test(text)) {
      map.set(slug, { slug, label, kind: "keyword" });
    }
  }

  return [...map.values()];
}
