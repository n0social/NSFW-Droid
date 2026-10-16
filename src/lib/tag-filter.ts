import { MATURE_TAG_SLUGS } from "@/lib/catalog-maturity";
import { FEATURED_RAIL_NICHE_TAG_SLUGS } from "@/lib/listings-ranking";

export type CatalogTagLike = { slug: string; label: string; kind: string };

/** itch/Steam promo and bracket noise normalized to slugs (e.g. `10-off`, `100-off`). */
const PRICING_TAG_SLUGS = new Set([
  "itch-sale",
  "on-sale",
  "sale",
  "discount",
  "price-free",
  "free",
]);

const PRICING_SLUG_PATTERNS: RegExp[] = [
  /^\d+-off$/,
  /^-?\d+%-off$/,
  /^\d+percent-off$/,
  /^price-/,
  /-sale$/,
  /^percent-off$/,
];

const ITCH_META_FEED_SLUGS = new Set(["itch-new", "itch-featured"]);

/** Violent / non-theme junk — hide from browse filters and block on ingest. */
const BLOCKED_BROWSE_TAG_SLUGS = new Set([
  "jack-the-ripper",
  "jeff-the-ripper",
  "jack-the-ripper-serial-killer",
  "jeff-the-ripper-serial-killer",
  "jeff-the-killer",
  "jeff-the-killer-game",
  "jeff-the-killer-creepypasta",
]);

const BLOCKED_BROWSE_TAG_SLUG_PATTERNS: RegExp[] = [
  /^jack-the-ripper/,
  /^jeff-the-ripper/,
  /^jeff-the-killer/,
];

export function isBlockedBrowseCatalogTagSlug(slug: string): boolean {
  const s = normalizeSlug(slug);
  if (!s) return false;
  if (BLOCKED_BROWSE_TAG_SLUGS.has(s)) return true;
  return BLOCKED_BROWSE_TAG_SLUG_PATTERNS.some((re) => re.test(s));
}

/** Steam `categories` / feature rows — not NSFW taxonomy. */
const STEAM_STORE_FEATURE_SLUGS = new Set([
  "single-player",
  "multi-player",
  "multiplayer",
  "co-op",
  "coop",
  "shared-split-screen",
  "cross-platform-multiplayer",
  "steam-achievements",
  "achievements",
  "steam-trading-cards",
  "trading-cards",
  "steam-workshop",
  "workshop",
  "steam-cloud",
  "cloud",
  "family-sharing",
  "remote-play-together",
  "remote-play-on-phone",
  "remote-play-on-tablet",
  "remote-play-on-tv",
  "full-controller-support",
  "partial-controller-support",
  "tracked-controller-support",
  "custom-audio-input",
  "commentary-available",
  "includes-level-editor",
  "includes-source-sdk",
  "valve-anti-cheat-enabled",
  "stats",
  "leaderboards",
  "mmo",
  "massively-multiplayer",
  "pvp",
  "pve",
  "online-co-op",
  "online-pvp",
  "lan-co-op",
  "lan-pvp",
  "local-co-op",
  "local-pvp",
  "shared-split-screen-co-op",
  "cross-platform",
  "vr-only",
  "vr-supported",
  "vr",
  "htc-vive",
  "oculus-rift",
  "windows-mixed-reality",
  "valve-index",
  "steam-turn-notifications",
  "in-app-purchases",
  "captions-available",
  "subtitles",
  "steam-timeline",
]);

const STEAM_STORE_FEATURE_SLUG_PATTERNS: RegExp[] = [
  /^remote-play/,
  /controller-support$/,
  /^steam-/,
  /-player$/,
  /^online-/,
  /^local-/,
  /^lan-/,
];

/** Broad Steam/itch store genres — hide unless NSFW theme signals apply. */
const GENERIC_STORE_GENRE_SLUGS = new Set([
  "action",
  "adventure",
  "casual",
  "indie",
  "racing",
  "sports",
  "strategy",
  "early-access",
  "free-to-play",
  "massively-multiplayer",
  "software",
  "utilities",
  "education",
  "photo-editing",
  "design-illustration",
  "game-development",
  "accounting",
  "animation-modeling",
  "audio-production",
  "video-production",
  "web-publishing",
]);

/** Feed-context slugs worth showing on /browse (mature browse + common NSFW-adjacent genres). */
const BROWSE_FEED_TAG_SLUGS = new Set([
  ...MATURE_TAG_SLUGS,
  "visual-novel",
  "dating-sim",
  "simulation",
  "sandbox",
  "rpg",
  "nsfw",
]);

const NSFW_THEME_RE =
  /\b(nsfw|18\+|adult|erotic|lewd|hentai|porn|xxx|nude|nudity|sexual|mature|ecchi|harem|threesome|impregnation|breeding|pregnancy|lactation|femdom|submission|bdsm|bondage|corruption|netorare|ntr|cuckold|milf|dilf|incest|taboo|tentacle|monster\s*girl|futanari|futa|femboy|trap|yuri|yaoi|lesbian|gay|bisexual|romance|dating|visual novel|vn|dating sim|fetish|kink|domination|slave|maid|nun|teacher|student|office\s*lady|wife|cheat|affair|exhibition|voyeur|masturbat|oral|anal|blowjob|handjob|footjob|paizuri|creampie|gangbang|orgy|swinger|polyamor|polygamy|wife\s*swap|hotwife|succubus|demon\s*girl|elf|catgirl|nekomimi|loli|shota|oppai|boobs|breasts|ass|thicc|bbw|petite|muscle|furry|anthro|vore|watersports|scat|urine|diaper|hypno|mind\s*control|blackmail|rape|non-?consensual|consensual\s*non-?consent|cnc)\b/i;

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

function labelLooksLikePricing(label: string): boolean {
  const raw = label.trim();
  if (!raw) return false;
  if (/^\$|USD|EUR|GBP|¥|€|£/i.test(raw)) return true;
  if (/^free$/i.test(raw)) return true;
  if (/\b(on\s+)?sale\b/i.test(raw)) return true;
  if (/\b\d+\s*%\s*off\b/i.test(raw)) return true;
  if (/^-\d+%$/.test(raw)) return true;
  if (/^\d+(\.\d{2})?\s*(usd|eur|gbp)?$/i.test(raw)) return true;
  if (/^\d+\s+off$/i.test(raw)) return true;
  return false;
}

/** Promo / price tags — used by browse filters and title bracket extraction. */
export function isPricingOrPromoCatalogTag(slug: string, label = ""): boolean {
  const s = normalizeSlug(slug);
  if (!s) return false;
  if (PRICING_TAG_SLUGS.has(s)) return true;
  if (PRICING_SLUG_PATTERNS.some((re) => re.test(s))) return true;
  if (labelLooksLikePricing(label)) return true;
  return false;
}

export function isSteamStoreFeatureTagSlug(slug: string): boolean {
  const s = normalizeSlug(slug);
  if (!s) return false;
  if (STEAM_STORE_FEATURE_SLUGS.has(s)) return true;
  return STEAM_STORE_FEATURE_SLUG_PATTERNS.some((re) => re.test(s));
}

function hasNsfwThemeSignal(slug: string, label: string): boolean {
  const hay = `${slug.replace(/-/g, " ")} ${label}`;
  return NSFW_THEME_RE.test(hay);
}

function isAllowedGenreBrowseTag(slug: string, label: string): boolean {
  const s = normalizeSlug(slug);
  if (GENERIC_STORE_GENRE_SLUGS.has(s)) return false;
  if (isSteamStoreFeatureTagSlug(s)) return false;
  if (MATURE_TAG_SLUGS.has(s) || FEATURED_RAIL_NICHE_TAG_SLUGS.has(s)) return true;
  if (hasNsfwThemeSignal(s, label)) return true;
  return false;
}

/**
 * Tags shown in /browse filter dropdown and tag facets.
 * Listing rows may still carry hidden tags for maturity/ranking internals.
 */
export function isNsfwBrowseCatalogTag(tag: CatalogTagLike): boolean {
  const slug = normalizeSlug(tag.slug);
  const label = tag.label.trim();
  const kind = tag.kind.trim().toLowerCase();

  if (!slug) return false;
  if (isBlockedBrowseCatalogTagSlug(slug)) return false;

  if (kind === "platform" || kind === "source" || kind === "category") return false;
  if (isPricingOrPromoCatalogTag(slug, label)) return false;
  if (isSteamStoreFeatureTagSlug(slug)) return false;
  if (ITCH_META_FEED_SLUGS.has(slug)) return false;
  if (slug === "steam") return false;

  if (kind === "keyword" || kind === "content") return true;

  if (MATURE_TAG_SLUGS.has(slug) || FEATURED_RAIL_NICHE_TAG_SLUGS.has(slug)) return true;

  if (kind === "feed") {
    return BROWSE_FEED_TAG_SLUGS.has(slug) || hasNsfwThemeSignal(slug, label);
  }

  if (kind === "genre") {
    return isAllowedGenreBrowseTag(slug, label);
  }

  return hasNsfwThemeSignal(slug, label);
}

export function filterTagsForBrowseDisplay<T extends CatalogTagLike>(tags: T[]): T[] {
  return tags.filter(isNsfwBrowseCatalogTag);
}

/** Drop junk before persisting new tag rows (defense in depth with browse filter). */
export function filterExtractedCatalogTags<T extends CatalogTagLike>(tags: T[]): T[] {
  return tags.filter((t) => {
    const slug = normalizeSlug(t.slug);
    const kind = t.kind.trim().toLowerCase();
    if (kind === "platform") return true;
    if (kind === "category" || kind === "source") return false;
    if (isPricingOrPromoCatalogTag(slug, t.label)) return false;
    if (isSteamStoreFeatureTagSlug(slug)) return false;
    if (isBlockedBrowseCatalogTagSlug(slug)) return false;
    if (kind === "category") return false;
    return true;
  });
}
