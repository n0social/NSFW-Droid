/** Stable short token from an external id (URLs, Steam app ids, etc.). */
export function externalIdSlugSuffix(externalId: string) {
  const trimmed = externalId.trim();
  const fromUrl = trimmed.replace(/^https?:\/\//i, "").replace(/[?#].*$/, "");
  const itch = fromUrl.match(/^([a-z0-9_-]+)\.itch\.io\/([a-z0-9_-]+)/i);
  if (itch) {
    return `${itch[1]}-${itch[2]}`
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
  }
  const slugPart = fromUrl
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (slugPart.length >= 6) {
    const tail = slugPart.slice(-24).replace(/^-+|-+$/g, "");
    return tail.length >= 6 ? tail : slugPart.slice(0, 24);
  }
  const compact = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return (compact || "item").slice(0, 16);
}

export function titleSlugBase(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function slugify(title: string, suffix: string) {
  return `${titleSlugBase(title)}-${externalIdSlugSuffix(suffix)}`;
}
