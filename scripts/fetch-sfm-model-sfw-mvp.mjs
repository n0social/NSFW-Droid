/**
 * Download SFW MVP card images for curated SFM models, resize to 3:4, write WebP.
 *
 * Usage:
 *   node scripts/fetch-sfm-model-sfw-mvp.mjs
 *   node scripts/fetch-sfm-model-sfw-mvp.mjs --out public/creator-models
 *
 * Artifacts (candidates + manifest):
 *   /opt/cursor/artifacts/sfm-model-mvp-sfw/{id}/source.jpg
 *   /opt/cursor/artifacts/sfm-model-mvp-sfw/manifest.json
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "sfm-model-sfw-sources.json");
const ARTIFACT_ROOT =
  process.env.SFM_SFW_MVP_DIR ?? "/opt/cursor/artifacts/sfm-model-mvp-sfw";
const OUT_WEBP =
  process.argv.includes("--out")
    ? process.argv[process.argv.indexOf("--out") + 1]
    : path.join(process.cwd(), "public/creator-models");

const CARD_W = 600;
const CARD_H = 800;
const UA =
  "Mozilla/5.0 (compatible; NSFW-Droid/1.0; +https://github.com/n0social/NSFW-Droid)";

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function makeAuntCassPlaceholder() {
  const svg = `
    <svg width="${CARD_W}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5b21b6"/>
          <stop offset="50%" stop-color="#2d1b4e"/>
          <stop offset="100%" stop-color="#14061c"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <ellipse cx="300" cy="280" rx="90" ry="110" fill="#1f2937" opacity="0.85"/>
      <ellipse cx="300" cy="500" rx="140" ry="200" fill="#1f2937" opacity="0.75"/>
      <text x="300" y="720" text-anchor="middle" fill="#f9a8d4" font-family="system-ui,sans-serif" font-size="28" font-weight="700">Aunt Cass</text>
      <text x="300" y="752" text-anchor="middle" fill="#e9d5ff" font-family="system-ui,sans-serif" font-size="14" opacity="0.8">Big Hero 6</text>
    </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function toCardWebp(input, position = "top") {
  return sharp(input)
    .resize(CARD_W, CARD_H, { fit: "cover", position })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

async function main() {
  const sources = JSON.parse(await readFile(ROOT, "utf8"));
  await mkdir(ARTIFACT_ROOT, { recursive: true });
  await mkdir(OUT_WEBP, { recursive: true });

  const manifest = [];

  for (const entry of sources) {
    const dir = path.join(ARTIFACT_ROOT, entry.id);
    await mkdir(dir, { recursive: true });

    let raw;
    let fetchedFrom = entry.sourceUrl;
    if (entry.id === "aunt-cass" || !entry.sourceUrl) {
      raw = await makeAuntCassPlaceholder();
      fetchedFrom = "generated:svg-silhouette";
      await writeFile(path.join(dir, "source.png"), raw);
    } else {
      raw = await fetchBuffer(entry.sourceUrl);
      const ext = /\.png/i.test(entry.sourceUrl) ? "png" : "jpg";
      await writeFile(path.join(dir, `source.${ext}`), raw);
    }

    const webp = await toCardWebp(raw, entry.cropPosition ?? "top");
    const webpName = `${entry.id}.webp`;
    await writeFile(path.join(dir, webpName), webp);
    await writeFile(path.join(OUT_WEBP, webpName), webp);

    manifest.push({
      id: entry.id,
      characterName: entry.characterName,
      sourceUrl: entry.sourceUrl,
      sourcePage: entry.sourcePage,
      licenseNote: entry.licenseNote,
      fetchedFrom,
      artifactDir: dir,
      webp: path.join(OUT_WEBP, webpName),
    });
    console.log(`ok\t${entry.id}\t${webp.length} bytes\t${fetchedFrom}`);
  }

  await writeFile(
    path.join(ARTIFACT_ROOT, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(`\nWrote ${manifest.length} cards → ${OUT_WEBP}`);
  console.log(`Manifest → ${path.join(ARTIFACT_ROOT, "manifest.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
