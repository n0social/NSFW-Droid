import { themeAssetPath } from "./registry";
import { themeAssetUrl } from "./asset-url";
import type { ResolvedLayoutDecorItem, ThemeDefinition, ThemeLayoutDecorSlot } from "./types";

export function resolveLayoutDecorForTheme(theme: ThemeDefinition): ResolvedLayoutDecorItem[] {
  if (!theme.layoutDecor?.length || theme.id === "default") return [];

  const out: ResolvedLayoutDecorItem[] = [];
  for (const entry of theme.layoutDecor) {
    if (!themeAssetPath(theme.id, entry.file)) continue;
    out.push({
      url: themeAssetUrl(theme.id, entry.file),
      slot: entry.slot,
      opacity: entry.opacity,
    });
  }
  return out;
}

export function layoutDecorForSlot(
  items: ResolvedLayoutDecorItem[],
  slot: ThemeLayoutDecorSlot,
): ResolvedLayoutDecorItem[] {
  return items.filter((i) => i.slot === slot);
}
