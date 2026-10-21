import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG_PAGE_REVALIDATE_SECONDS } from "../src/lib/catalog-revalidate";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const CATALOG_PAGES = [
  "src/app/page.tsx",
  "src/app/browse/page.tsx",
  "src/app/game/[slug]/page.tsx",
  "src/app/sitemap.ts",
];

if (!Number.isFinite(CATALOG_PAGE_REVALIDATE_SECONDS) || CATALOG_PAGE_REVALIDATE_SECONDS < 60) {
  console.error("CATALOG_PAGE_REVALIDATE_SECONDS should be at least 60");
  process.exit(1);
}

for (const rel of CATALOG_PAGES) {
  const src = readFileSync(join(ROOT, rel), "utf8");
  if (src.includes('export const dynamic = "force-dynamic"')) {
    console.error(`${rel} still uses force-dynamic`);
    process.exit(1);
  }
  if (!src.includes("CATALOG_PAGE_REVALIDATE_SECONDS")) {
    console.error(`${rel} missing CATALOG_PAGE_REVALIDATE_SECONDS import`);
    process.exit(1);
  }
  if (!src.includes("export const revalidate = CATALOG_PAGE_REVALIDATE_SECONDS")) {
    console.error(`${rel} missing export const revalidate`);
    process.exit(1);
  }
}

console.log(
  `ok (catalog ISR ${CATALOG_PAGE_REVALIDATE_SECONDS}s on ${CATALOG_PAGES.length} routes)`,
);
