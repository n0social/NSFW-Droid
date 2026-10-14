import fs from "node:fs";
import path from "node:path";
import { DEFAULT_THEME } from "./default-theme";
import type { ThemeDefinition } from "./types";

const THEMES_DIR = path.join(process.cwd(), "data", "themes");

let cached: ThemeDefinition[] | null = null;

function readThemeJson(dir: string, id: string): ThemeDefinition | null {
  const file = path.join(dir, "theme.json");
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as ThemeDefinition;
    if (!parsed.id) parsed.id = id;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Loads holiday themes from data/themes/<id>/theme.json.
 * Add folders on the server without redeploying the app bundle (restart may be needed for FS cache).
 */
export function loadThemeRegistry(): ThemeDefinition[] {
  if (cached) return cached;

  const holidays: ThemeDefinition[] = [];
  if (fs.existsSync(THEMES_DIR)) {
    for (const entry of fs.readdirSync(THEMES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const theme = readThemeJson(path.join(THEMES_DIR, entry.name), entry.name);
      if (theme && theme.id !== "default") holidays.push(theme);
    }
  }

  holidays.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  cached = [DEFAULT_THEME, ...holidays];
  return cached;
}

export function getThemeById(id: string): ThemeDefinition {
  const found = loadThemeRegistry().find((t) => t.id === id);
  return found ?? DEFAULT_THEME;
}

export function themeIconPath(themeId: string): string | null {
  if (themeId === "default") return null;
  const dir = path.join(THEMES_DIR, themeId);
  const theme = getThemeById(themeId);
  const fileName = theme.icon ?? "icon.svg";
  const full = path.join(dir, fileName);
  return fs.existsSync(full) ? full : null;
}

/** Clear in-memory registry (tests). */
export function resetThemeRegistryCache(): void {
  cached = null;
}
