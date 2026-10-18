/**
 * Download SFW MVP card images for curated SFM models, resize to 3:4, write WebP.
 *
 * Usage:
 *   node scripts/fetch-sfm-model-sfw-mvp.mjs
 *   node scripts/fetch-sfm-model-sfw-mvp.mjs --only juno
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
    if (!entry.sourceUrl) {
      throw new Error(`${entry.id}: missing sourceUrl in sfm-model-sfw-sources.json`);
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
