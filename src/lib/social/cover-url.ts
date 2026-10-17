import { siteUrl } from "@/lib/site";

/** Same absolute URL the catalog uses in GameCard / game detail (`cover_image_url`). */
export function resolveListingCoverUrl(
  coverImageUrl: string | null | undefined,
): string | null {
  const raw = coverImageUrl?.trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  const base = siteUrl.replace(/\/$/, "");
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${base}${path}`;
}
