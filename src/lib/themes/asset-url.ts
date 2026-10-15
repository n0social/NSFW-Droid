/** Public URL for a theme SVG (served from data/themes/<id>/). */
export function themeAssetUrl(themeId: string, fileName: string): string {
  return `/api/theme/asset/${encodeURIComponent(themeId)}/${encodeURIComponent(fileName)}`;
}

export type ThemeDecorFiles = {
  decor: string;
  chip: string;
  rail: string;
  badge: string;
  empty: string;
};

export function themeDecorUrls(themeId: string): ThemeDecorFiles | null {
  if (!themeId || themeId === "default") return null;
  return {
    decor: themeAssetUrl(themeId, "decor.svg"),
    chip: themeAssetUrl(themeId, "chip.svg"),
    rail: themeAssetUrl(themeId, "rail.svg"),
    badge: themeAssetUrl(themeId, "badge.svg"),
    empty: themeAssetUrl(themeId, "empty.svg"),
  };
}
