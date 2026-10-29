/** Canonical public URL for a published listing detail page. */
export function gameListingPath(slug: string): string {
  return `/game/${slug}`;
}

/** Slugs safe to put in sitemap / canonical paths (excludes historic ingest junk). */
export function isListingSlugSafeForPublicUrl(slug: string): boolean {
  const s = slug.trim();
  if (!s || s.length > 220) return false;
  if (s.includes("://")) return false;
  if (/https?:$/i.test(s)) return false;
  if (s.includes("?") || s.includes("#")) return false;
  return true;
}
