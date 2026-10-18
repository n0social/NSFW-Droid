/**
 * Download SFW MVP card images for curated SFM models, resize to 3:4, write WebP.
 *
 * Usage:
 *   node scripts/fetch-sfm-model-sfw-mvp.mjs
 *   node scripts/fetch-sfm-model-sfw-mvp.mjs --only aunt-cass
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

/** Original SFW card art — stylized café aunt (not Disney assets; no robot/Baymax cues). */
async function makeAuntCassPlaceholder() {
  const svg = `
    <svg width="${CARD_W}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stop-color="#fff7ed"/>
          <stop offset="35%" stop-color="#fdba74"/>
          <stop offset="72%" stop-color="#ea580c"/>
          <stop offset="100%" stop-color="#7c2d12"/>
        </linearGradient>
        <radialGradient id="warm" cx="50%" cy="32%" r="50%">
          <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#fef3c7" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#warm)"/>
      <ellipse cx="300" cy="718" rx="200" ry="70" fill="#431407" opacity="0.22"/>

      <!-- shoulders / cardigan -->
      <path d="M175 430 C200 395 400 395 425 430 L440 560 C400 590 200 590 160 560 Z"
            fill="#1e3a5f" opacity="0.92"/>
      <path d="M220 430 L380 430 L365 500 L235 500 Z" fill="#f8fafc" opacity="0.95"/>

      <!-- neck -->
      <rect x="278" y="368" width="44" height="52" rx="12" fill="#fecaca"/>

      <!-- face -->
      <ellipse cx="300" cy="310" rx="72" ry="82" fill="#fecaca"/>
      <path d="M228 300 C228 235 258 198 300 198 C342 198 372 235 372 300 C372 328 360 348 345 358 L255 358 C240 348 228 328 228 300 Z"
            fill="#fdba74" opacity="0.35"/>

      <!-- auburn curls (Aunt Cass hair cue) -->
      <path d="M228 290 C210 220 240 155 300 145 C360 155 390 220 372 290 C385 265 395 235 388 200 C375 130 340 95 300 88 C260 95 225 130 212 200 C205 235 215 265 228 290 Z"
            fill="#b45309" opacity="0.95"/>
      <path d="M238 248 C250 210 275 188 300 185 C325 188 350 210 362 248 C352 225 330 208 300 205 C270 208 248 225 238 248 Z"
            fill="#92400e" opacity="0.5"/>
      <ellipse cx="248" cy="268" rx="22" ry="34" fill="#c2410c" opacity="0.85"/>
      <ellipse cx="352" cy="268" rx="22" ry="34" fill="#c2410c" opacity="0.85"/>

      <!-- round glasses + human eyes -->
      <circle cx="268" cy="308" r="26" fill="none" stroke="#334155" stroke-width="4"/>
      <circle cx="332" cy="308" r="26" fill="none" stroke="#334155" stroke-width="4"/>
      <line x1="294" y1="308" x2="306" y2="308" stroke="#334155" stroke-width="3"/>
      <circle cx="268" cy="310" r="7" fill="#78350f"/>
      <circle cx="332" cy="310" r="7" fill="#78350f"/>
      <circle cx="270" cy="307" r="2.5" fill="#fff" opacity="0.7"/>
      <circle cx="334" cy="307" r="2.5" fill="#fff" opacity="0.7"/>

      <!-- smile -->
      <path d="M278 338 Q300 352 322 338" fill="none" stroke="#9f1239" stroke-width="3.5" stroke-linecap="round"/>

      <!-- bakery apron -->
      <path d="M210 500 C240 470 360 470 390 500 L375 640 C340 665 260 665 225 640 Z"
            fill="#fef08a" opacity="0.95"/>
      <path d="M285 500 L315 500 L305 575 L295 575 Z" fill="#f97316" opacity="0.85"/>

      <text x="300" y="718" text-anchor="middle" fill="#fffbeb" font-family="system-ui,sans-serif" font-size="30" font-weight="800" stroke="#7c2d12" stroke-width="0.5">Aunt Cass</text>
      <text x="300" y="752" text-anchor="middle" fill="#ffedd5" font-family="system-ui,sans-serif" font-size="14" opacity="0.95">Lucky Cat Café · fan-style card</text>
    </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function toCardWebp(input, position = "top") {
  return sharp(input)
    .resize(CARD_W, CARD_H, { fit: "cover", position })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

function parseOnlyIds(argv) {
  const i = argv.indexOf("--only");
  if (i === -1) return null;
  const ids = [];
  for (let j = i + 1; j < argv.length; j++) {
    const a = argv[j];
    if (a.startsWith("--")) break;
    ids.push(a);
  }
  return ids.length ? ids : null;
}

async function main() {
  const onlyIds = parseOnlyIds(process.argv);
  let sources = JSON.parse(await readFile(ROOT, "utf8"));
  if (onlyIds) {
    const set = new Set(onlyIds);
    sources = sources.filter((e) => set.has(e.id));
    if (!sources.length) {
      throw new Error(`--only: no matching ids in ${ROOT} (${onlyIds.join(", ")})`);
    }
  }
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
