import { readFileSync } from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import { unstable_cache } from "next/cache";
import { posterUrlFromVideoEnclosure } from "@/lib/video-thumbnail";

const FETCH_USER_AGENT =
  "NSFW-Droid-Catalog/0.1 (link catalog; +https://github.com/n0social/NSFW-Droid)";

export type VideoFeedConfig = {
  id: string;
  label: string;
  siteUrl: string;
  feedUrl: string;
  enabled: boolean;
  maxItems: number;
};

export type VideoTopListingConfig = {
  enabled: boolean;
  sourceId: string;
  label: string;
  listingUrl: string;
  maxItems: number;
  maxPages: number;
};

export type VideoFeedFile = {
  feeds: VideoFeedConfig[];
  topListing?: VideoTopListingConfig;
  fetch: {
    revalidateSeconds: number;
    topRevalidateSeconds?: number;
    timeoutMs: number;
  };
};

export type VideoFeedItem = {
  id: string;
  title: string;
  link: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  sourceId: string;
  sourceLabel: string;
  categories: string[];
};

export type VideosResult = {
  items: VideoFeedItem[];
  sources: { id: string; label: string; feedUrl: string; ok: boolean; error?: string }[];
  fetchedAt: string;
};

/** @deprecated Use {@link VideosResult} */
export type RecentVideosResult = VideosResult;

function loadVideoFeedsFile(): VideoFeedFile {
  const filePath = path.join(process.cwd(), "data", "video-feeds.json");
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as VideoFeedFile;
}

export function getVideoFeedConfig(): VideoFeedFile {
  return loadVideoFeedsFile();
}

export function hasEnabledVideoFeeds(): boolean {
  return getVideoFeedConfig().feeds.some((f) => f.enabled && f.feedUrl.trim());
}

export function hasEnabledTopVideoListing(): boolean {
  const top = getVideoFeedConfig().topListing;
  return Boolean(top?.enabled && top.listingUrl.trim());
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** WordPress RSS often leaves `&#038;` in `<link>`; must decode before `URL` parsing. */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

function normalizeLink(link: string): string {
  const decoded = decodeHtmlEntities(link.trim());
  try {
    const u = new URL(decoded);
    u.searchParams.delete("utm_source");
    u.searchParams.delete("utm_medium");
    u.searchParams.delete("utm_campaign");
    u.hash = "";
    return u.toString();
  } catch {
    return decoded;
  }
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function readAttr(node: unknown, key: string): string {
  if (!node || typeof node !== "object") return "";
  const rec = node as Record<string, unknown>;
  const prefixed = rec[`@_${key}`];
  if (typeof prefixed === "string") return prefixed.trim();
  const plain = rec[key];
  return typeof plain === "string" ? plain.trim() : "";
}

function firstImageInHtml(html: string): string | null {
  const decoded = decodeHtmlEntities(html);
  const m = decoded.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (!m) return null;
  const url = m[1].trim();
  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) return url;
  return null;
}

function extractThumbnail(item: Record<string, unknown>): string | null {
  const topThumb = item["media:thumbnail"];
  for (const t of asArray(topThumb)) {
    const url = decodeHtmlEntities(readAttr(t, "url"));
    if (url.startsWith("http")) return url;
  }

  const media = item["media:content"];
  const nodes = asArray(media);
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const rec = node as Record<string, unknown>;
    const thumb = rec["media:thumbnail"];
    const thumbs = asArray(thumb);
    for (const t of thumbs) {
      const url = decodeHtmlEntities(readAttr(t, "url"));
      if (url.startsWith("http")) return url;
    }
    const direct = decodeHtmlEntities(readAttr(rec, "url"));
    if (direct.startsWith("http") && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(direct)) {
      return direct;
    }
  }

  const enclosure = item.enclosure;
  for (const enc of asArray(enclosure)) {
    const url = decodeHtmlEntities(readAttr(enc, "url"));
    const type = readAttr(enc, "type").toLowerCase();
    if (url.startsWith("http") && type.startsWith("image/")) return url;
    if (url.startsWith("http") && type.startsWith("video/")) {
      const poster = posterUrlFromVideoEnclosure(url);
      if (poster) return poster;
    }
  }

  const description = String(item.description ?? "");
  if (description) {
    const fromDesc = firstImageInHtml(description);
    if (fromDesc) return fromDesc;
  }

  return null;
}

function extractCategories(item: Record<string, unknown>): string[] {
  const cats = asArray(item.category);
  const labels: string[] = [];
  for (const c of cats) {
    if (typeof c === "string") {
      const t = stripHtml(c);
      if (t) labels.push(t);
    } else if (c && typeof c === "object") {
      const t = stripHtml(String((c as Record<string, unknown>)["#text"] ?? ""));
      if (t) labels.push(t);
    }
  }
  return labels.slice(0, 6);
}

function parseRssItems(xml: string, feed: VideoFeedConfig): VideoFeedItem[] {
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const doc = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown } };
  };
  const rawItems = doc?.rss?.channel?.item;
  const list = asArray(rawItems as Record<string, unknown> | Record<string, unknown>[]);

  const out: VideoFeedItem[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const title = stripHtml(String(rec.title ?? "")).slice(0, 300);
    const link = normalizeLink(String(rec.link ?? ""));
    if (!title || !link.startsWith("http")) continue;

    const pubRaw = String(rec.pubDate ?? rec.published ?? "").trim();
    const publishedAt = pubRaw ? new Date(pubRaw).toISOString() : null;
    const guid = String(rec.guid ?? link).trim();
    const thumb = extractThumbnail(rec);

    out.push({
      id: `${feed.id}:${guid}`,
      title,
      link,
      publishedAt,
      thumbnailUrl: thumb,
      sourceId: feed.id,
      sourceLabel: feed.label,
      categories: extractCategories(rec),
    });
    if (out.length >= feed.maxItems) break;
  }
  return out;
}

async function fetchFeedXml(feed: VideoFeedConfig, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(feed.feedUrl, {
      headers: {
        "User-Agent": FETCH_USER_AGENT,
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: controller.signal,
      next: { revalidate: getVideoFeedConfig().fetch.revalidateSeconds },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const text = await res.text();
    const peek = text.trimStart();
    if (!peek.startsWith("<?xml") && !peek.startsWith("<rss")) {
      throw new Error("not_xml");
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRecentVideosUncached(limit?: number): Promise<VideosResult> {
  const config = getVideoFeedConfig();
  const enabled = config.feeds.filter((f) => f.enabled && f.feedUrl.trim());
  const sources: VideosResult["sources"] = [];
  const merged: VideoFeedItem[] = [];

  for (const feed of enabled) {
    try {
      const xml = await fetchFeedXml(feed, config.fetch.timeoutMs);
      const items = parseRssItems(xml, feed);
      merged.push(...items);
      sources.push({ id: feed.id, label: feed.label, feedUrl: feed.feedUrl, ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : "fetch_failed";
      sources.push({
        id: feed.id,
        label: feed.label,
        feedUrl: feed.feedUrl,
        ok: false,
        error: message,
      });
    }
  }

  const seen = new Set<string>();
  const sorted = merged
    .filter((item) => {
      const key = item.link.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return tb - ta;
    });

  const cap = limit ?? 48;
  return {
    items: sorted.slice(0, cap),
    sources,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getRecentVideos(limit?: number): Promise<VideosResult> {
  const config = getVideoFeedConfig();
  const revalidate = Math.max(60, config.fetch.revalidateSeconds || 3600);
  const cached = unstable_cache(
    () => fetchRecentVideosUncached(limit),
    ["video-feed-recent", String(limit ?? "all")],
    { revalidate },
  );
  return cached();
}

const ARTICLE_BLOCK_RE =
  /<article id="post-\d+"[\s\S]*?<\/article>/gi;
const ENTRY_TITLE_RE =
  /<h2[^>]*entry-title[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/i;
const POSTER_RE = /poster="([^"]+)"/i;
const UPLOAD_THUMB_RE =
  /https:\/\/sfmcompile\.club\/wp-content\/uploads\/[^"\s]+\.(?:jpg|jpeg|png|webp)/i;
const UPLOAD_MP4_RE = /https:\/\/sfmcompile\.club\/wp-content\/uploads\/[^"\s]+\.mp4/i;
const WP_POST_IMAGE_RE =
  /<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]+)"/i;
const LAZY_IMG_RE =
  /data-src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i;

function listingPageUrl(base: string, page: number): string {
  if (page <= 1) return base;
  try {
    const u = new URL(base);
    const path = u.pathname.replace(/\/?$/, "");
    if (path === "" || path === "/") {
      u.pathname = `/page/${page}/`;
    } else {
      u.pathname = `${path}/page/${page}/`.replace(/\/{2,}/g, "/");
    }
    return u.toString();
  } catch {
    return base;
  }
}

function parsePopularListingHtml(html: string, listing: VideoTopListingConfig): VideoFeedItem[] {
  const blocks = html.match(ARTICLE_BLOCK_RE) ?? [];
  const out: VideoFeedItem[] = [];

  for (const block of blocks) {
    const titleMatch = block.match(ENTRY_TITLE_RE);
    if (!titleMatch) continue;
    const link = normalizeLink(titleMatch[1]);
    const title = stripHtml(decodeHtmlEntities(titleMatch[2])).slice(0, 300);
    if (!title || !link.startsWith("http")) continue;
    if (/\/category\/|\/tag\/|\/page\/|top-10-animations/i.test(link)) continue;

    const poster =
      block.match(POSTER_RE)?.[1] ??
      block.match(UPLOAD_THUMB_RE)?.[0] ??
      block.match(WP_POST_IMAGE_RE)?.[1] ??
      block.match(LAZY_IMG_RE)?.[1] ??
      null;
    let thumb = poster ? decodeHtmlEntities(poster).trim() : null;
    if (!thumb?.startsWith("http")) {
      const mp4 = block.match(UPLOAD_MP4_RE)?.[0];
      if (mp4) thumb = posterUrlFromVideoEnclosure(mp4);
    }

    out.push({
      id: `${listing.sourceId}:popular:${link}`,
      title,
      link,
      publishedAt: null,
      thumbnailUrl: thumb?.startsWith("http") ? thumb : null,
      sourceId: listing.sourceId,
      sourceLabel: listing.label,
      categories: [],
    });
    if (out.length >= listing.maxItems) break;
  }

  return out;
}

async function fetchListingHtml(url: string, timeoutMs: number, revalidateSeconds: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": FETCH_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function enrichFromRssItems(items: VideoFeedItem[], rssItems: VideoFeedItem[]): VideoFeedItem[] {
  const byLink = new Map(rssItems.map((item) => [item.link.toLowerCase(), item]));
  return items.map((item) => {
    const fromFeed = byLink.get(item.link.toLowerCase());
    if (!fromFeed) return item;
    return {
      ...item,
      publishedAt: fromFeed.publishedAt,
      categories: fromFeed.categories,
      thumbnailUrl: item.thumbnailUrl ?? fromFeed.thumbnailUrl,
    };
  });
}

async function fetchTopVideosUncached(limit?: number): Promise<VideosResult> {
  const config = getVideoFeedConfig();
  const listing = config.topListing;
  if (!listing?.enabled || !listing.listingUrl.trim()) {
    return { items: [], sources: [], fetchedAt: new Date().toISOString() };
  }

  const cap = limit ?? listing.maxItems;
  const revalidate = Math.max(
    60,
    config.fetch.topRevalidateSeconds ?? config.fetch.revalidateSeconds ?? 3600,
  );
  const merged: VideoFeedItem[] = [];
  const seen = new Set<string>();
  let lastError: string | undefined;

  for (let page = 1; page <= listing.maxPages && merged.length < cap; page += 1) {
    const pageUrl = listingPageUrl(listing.listingUrl, page);
    try {
      const html = await fetchListingHtml(pageUrl, config.fetch.timeoutMs, revalidate);
      const slice = parsePopularListingHtml(html, { ...listing, maxItems: cap - merged.length });
      for (const item of slice) {
        const key = item.link.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
        if (merged.length >= cap) break;
      }
      if (slice.length === 0) break;
    } catch (e) {
      lastError = e instanceof Error ? e.message : "fetch_failed";
      break;
    }
  }

  let items = merged;
  const feed = config.feeds.find((f) => f.id === listing.sourceId && f.enabled);
  if (feed && items.length > 0) {
    try {
      const xml = await fetchFeedXml(feed, config.fetch.timeoutMs);
      const rssItems = parseRssItems(xml, feed);
      items = enrichFromRssItems(items, rssItems);
    } catch {
      /* keep listing order without pub dates */
    }
  }

  const ok = items.length > 0;
  return {
    items: items.slice(0, cap),
    sources: [
      {
        id: listing.sourceId,
        label: listing.label,
        feedUrl: listing.listingUrl,
        ok,
        error: ok ? undefined : lastError ?? "no_items",
      },
    ],
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Top / popular videos (SFM Compile `?filter-by=popular` HTML listing).
 * RSS `feed/?filter-by=popular` mirrors the default channel — not used for ranking.
 */
export async function getTopVideos(limit?: number): Promise<VideosResult> {
  const config = getVideoFeedConfig();
  const revalidate = Math.max(
    60,
    config.fetch.topRevalidateSeconds ?? config.fetch.revalidateSeconds ?? 3600,
  );
  const cached = unstable_cache(
    () => fetchTopVideosUncached(limit),
    ["video-feed-top", String(limit ?? "all")],
    { revalidate },
  );
  return cached();
}
