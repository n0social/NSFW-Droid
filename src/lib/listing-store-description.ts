import type { Listing } from "@/db/schema";

const MAX_STORE_DESCRIPTION_LEN = 600;

/** Strip HTML / entities from feed or API copy for on-page + meta use. */
export function plainTextFromStoreHtml(raw: string): string {
  let s = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > MAX_STORE_DESCRIPTION_LEN) {
    s = `${s.slice(0, MAX_STORE_DESCRIPTION_LEN - 1).trim()}…`;
  }
  return s;
}

function firstNonEmpty(...values: (string | null | undefined)[]): string | null {
  for (const v of values) {
    const t = typeof v === "string" ? v.trim() : "";
    if (t) return t;
  }
  return null;
}

/** Extract a publishable synopsis from a candidate `raw_payload`. */
export function storeDescriptionFromRawPayload(
  source: Listing["source"],
  rawPayload: unknown,
): string | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;
  const raw = rawPayload as Record<string, unknown>;

  if (source === "steam") {
    const steam = raw.steam as { short_description?: string } | undefined;
    const text = firstNonEmpty(steam?.short_description, raw.short_description as string);
    return text ? plainTextFromStoreHtml(text) : null;
  }

  if (source === "itch") {
    const encoded = raw["content:encoded"] as string | undefined;
    const description = raw.description as string | undefined;
    const text = firstNonEmpty(encoded, description, raw.summary as string);
    return text ? plainTextFromStoreHtml(text) : null;
  }

  const generic = firstNonEmpty(
    raw.short_description as string,
    raw.description as string,
    raw.summary as string,
  );
  return generic ? plainTextFromStoreHtml(generic) : null;
}

export function listingSynopsisForSeo(
  listing: Pick<Listing, "storeDescription">,
  fallback: string,
): string {
  const store = listing.storeDescription?.trim();
  if (store && store.length >= 40) return store;
  return fallback;
}
