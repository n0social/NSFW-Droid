/** Catalog UI: no store pricing or sale badges — prices on itch/Steam change independently. */

import { isPricingOrPromoCatalogTag } from "@/lib/tag-filter";

const BRACKET_SEGMENT_RE = /\[([^\]]+)\]/g;

const PLATFORM_BRACKET = new Set([
  "windows",
  "macos",
  "mac",
  "linux",
  "android",
  "browser",
  "html",
  "osx",
  "other",
  "free",
]);

/** SEO / a11y alt text for listing cover images (cards, detail hero, OG). */
export function listingCoverImageAlt(displayTitle: string): string {
  const trimmed = displayTitle.trim();
  return trimmed || "Game cover";
}

/** itch browse titles embed price/platform tags in brackets; strip for card/hero display only. */
export function displayListingTitle(storedTitle: string): string {
  let out = storedTitle.replace(BRACKET_SEGMENT_RE, (full, inner: string) => {
    const raw = inner.trim();
    if (!raw) return "";
    if (isPriceOrSaleBracket(raw)) return "";
    const lower = raw.toLowerCase();
    if (PLATFORM_BRACKET.has(lower)) return "";
    return full;
  });
  out = out.replace(/\s{2,}/g, " ").trim();
  return out || storedTitle.trim();
}

function isPriceOrSaleBracket(raw: string): boolean {
  if (/^\$|USD|EUR|GBP|¥|€|£/i.test(raw)) return true;
  if (/^free$/i.test(raw)) return true;
  if (/\b(on\s+)?sale\b/i.test(raw)) return true;
  if (/\b\d+\s*%\s*off\b/i.test(raw)) return true;
  if (/^-\d+%$/.test(raw)) return true;
  if (/^\d+(\.\d{2})?\s*(usd|eur|gbp)?$/i.test(raw)) return true;
  if (/^\d+\s+off$/i.test(raw)) return true;
  return false;
}

/** Hide feed/meta tags that imply pricing or promotions in browse filters. */
export function isPricingCatalogTagSlug(slug: string): boolean {
  return isPricingOrPromoCatalogTag(slug);
}

const RAW_PAYLOAD_PRICE_KEYS = new Set([
  "price",
  "currency",
  "min_price",
  "sale_price",
  "regular_price",
  "price_overview",
  "priceOverview",
]);

/** Admin/debug: omit volatile store price fields from raw_payload views. */
export function redactPricingFromRawPayload(rawPayload: unknown): unknown {
  if (!rawPayload || typeof rawPayload !== "object") return rawPayload;
  const out = { ...(rawPayload as Record<string, unknown>) };
  for (const key of RAW_PAYLOAD_PRICE_KEYS) {
    if (key in out) delete out[key];
  }
  const steam = out.steam;
  if (steam && typeof steam === "object") {
    const s = { ...(steam as Record<string, unknown>) };
    for (const key of RAW_PAYLOAD_PRICE_KEYS) {
      if (key in s) delete s[key];
    }
    out.steam = s;
  }
  return out;
}
