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
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7c3aed"/>
          <stop offset="45%" stop-color="#4c1d95"/>
          <stop offset="100%" stop-color="#14061c"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stop-color="#f9a8d4" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#f9a8d4" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect width="100%" height="100%" fill="url(#glow)"/>
      <ellipse cx="300" cy="720" rx="220" ry="80" fill="#0f172a" opacity="0.45"/>
      <path d="M300 120 C240 120 210 170 210 230 C210 260 225 285 250 300 L250 330 C220 350 195 390 190 440 L410 440 C405 390 380 350 350 330 L350 300 C375 285 390 260 390 230 C390 170 360 120 300 120 Z"
            fill="#e2e8f0" opacity="0.92"/>
      <ellipse cx="300" cy="248" rx="78" ry="88" fill="#f1f5f9" opacity="0.95"/>
      <path d="M228 248 C228 200 258 175 300 175 C342 175 372 200 372 248 C372 268 360 282 345 290 L255 290 C240 282 228 268 228 248 Z"
            fill="#334155" opacity="0.9"/>
      <rect x="248" y="262" width="104" height="18" rx="9" fill="#0f172a" opacity="0.75"/>
      <circle cx="272" cy="270" r="10" fill="#bae6fd" opacity="0.85"/>
      <circle cx="328" cy="270" r="10" fill="#bae6fd" opacity="0.85"/>
      <path d="M210 455 C250 420 350 420 390 455 L390 620 C350 655 250 655 210 620 Z"
            fill="#fda4af" opacity="0.88"/>
      <path d="M255 455 L345 455 L330 540 L270 540 Z" fill="#f8fafc" opacity="0.9"/>
      <text x="300" y="718" text-anchor="middle" fill="#fff1f7" font-family="system-ui,sans-serif" font-size="30" font-weight="800">Aunt Cass</text>
      <text x="300" y="752" text-anchor="middle" fill="#e9d5ff" font-family="system-ui,sans-serif" font-size="14" opacity="0.9">Big Hero 6 · SFW placeholder</text>
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
