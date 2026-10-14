/** Stable short token from an external id (URLs, Steam app ids, etc.). */
export function externalIdSlugSuffix(externalId: string) {
  const trimmed = externalId.trim();
  const fromUrl = trimmed.replace(/^https?:\/\//i, "").replace(/[?#].*$/, "");
  const slugPart = fromUrl
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (slugPart.length >= 6) return slugPart.slice(-16);
  const compact = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return (compact || "item").slice(0, 16);
}

export function slugify(title: string, suffix: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${externalIdSlugSuffix(suffix)}`;
}
