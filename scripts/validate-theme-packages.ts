/**
 * Audits holiday theme packages under data/themes/<id>/ and registry asset resolution.
 * Run: npm run validate:themes
 */
import fs from "node:fs";
import path from "node:path";
import {
  loadThemeRegistry,
  resetThemeRegistryCache,
  themeAssetPath,
  themeIconPath,
} from "../src/lib/themes/registry";

const THEMES_DIR = path.join(process.cwd(), "data", "themes");

/** Matches docs/themes.md — same set wired via themeDecorUrls(). */
const PACKAGE_FILES = {
  required: ["theme.json", "icon.svg", "decor.svg", "README.md"] as const,
  decorSet: ["decor.svg", "chip.svg", "rail.svg", "badge.svg", "empty.svg"] as const,
};

type Row = {
  id: string;
  files: Record<string, boolean>;
  iconRoute: boolean;
  assetsResolvable: boolean;
};

function fileExists(themeId: string, name: string): boolean {
  return fs.existsSync(path.join(THEMES_DIR, themeId, name));
}

function main(): void {
  resetThemeRegistryCache();
  const holidays = loadThemeRegistry().filter((t) => t.id !== "default");

  const rows: Row[] = [];
  let errors = 0;

  for (const theme of holidays) {
    const dir = path.join(THEMES_DIR, theme.id);
    if (!fs.existsSync(dir)) {
      console.error(`[missing] data/themes/${theme.id}/`);
      errors++;
      continue;
    }

    const files: Record<string, boolean> = {};
    for (const name of [...PACKAGE_FILES.required, ...PACKAGE_FILES.decorSet]) {
      const ok = fileExists(theme.id, name);
      files[name] = ok;
      if (!ok) {
        const level = PACKAGE_FILES.required.includes(name as (typeof PACKAGE_FILES.required)[number])
          ? "required"
          : "decor";
        console.error(`[${level}] ${theme.id}: missing ${name}`);
        errors++;
      }
    }

    const iconFile = theme.icon ?? "icon.svg";
    if (iconFile !== "icon.svg" && !files[iconFile]) {
      console.error(`[theme.json] ${theme.id}: icon "${iconFile}" not on disk`);
      errors++;
    }

    const iconRoute = themeIconPath(theme.id) !== null;
    if (!iconRoute) {
      console.error(`[registry] ${theme.id}: themeIconPath() returned null`);
      errors++;
    }

    let assetsResolvable = true;
    for (const name of PACKAGE_FILES.decorSet) {
      if (themeAssetPath(theme.id, name) === null) {
        console.error(`[registry] ${theme.id}: themeAssetPath(${name}) returned null`);
        assetsResolvable = false;
        errors++;
      }
    }

    rows.push({ id: theme.id, files, iconRoute, assetsResolvable });
  }

  console.log("\nTheme package matrix (file on disk):");
  const cols = ["theme.json", "icon.svg", "decor.svg", "chip.svg", "rail.svg", "badge.svg", "empty.svg"];
  console.log(["theme id", ...cols].join("\t"));
  for (const row of rows) {
    console.log(
      [row.id, ...cols.map((c) => (row.files[c] ? "✓" : "—"))].join("\t"),
    );
  }

  console.log("\nUI surfaces (any active holiday id, not Halloween-specific):");
  console.log("  decor.svg  → SiteHeader, HeroCarousel");
  console.log("  chip.svg   → ChipRow (active filter)");
  console.log("  rail.svg   → Storefront section headers");
  console.log("  badge.svg  → GameCard (rank ≤ 3)");
  console.log("  empty.svg  → Storefront empty favorites state");
  console.log("  icon.svg   → ThemeProvider banner, /api/theme/icon/<id>");

  if (errors > 0) {
    console.error(`\nvalidate-theme-packages: ${errors} error(s)`);
    process.exit(1);
  }

  console.log(`\nvalidate-theme-packages: OK (${rows.length} holiday themes)`);
}

main();
