/**
 * Fetch Open3DLab preview image URLs per curated SFM model (Playwright bypasses Anubis).
 * Usage: node scripts/scrape-sfm-model-previews.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MODELS = [
  { id: "tifa-lockhart", projectId: "0ecab6da-ddc5-4109-b9d5-fe4976fde428" },
  { id: "widowmaker", projectId: "9d953968-d1b0-452f-9572-544598a17b65" },
  { id: "d-va", projectId: "8f3a6013-b367-411c-b7d5-e07835bebf5c" },
  { id: "2b", projectId: "748da69c-42d3-4ee6-b4fd-3c3ad638acd5" },
  { id: "tracer", projectId: "5ffcf6dc-ade6-4ef9-9266-12614271162e" },
  { id: "mercy", projectId: "291bef9d-aeb2-441f-8726-703f079e7985" },
  { id: "lady-dimitrescu", projectId: "51462581-a31d-4d2a-b2ae-b3e1acf0c446" },
  { id: "jill-valentine", projectId: "cd428014-7528-406a-86b4-f3c6d5d3785b" },
  { id: "lara-croft", projectId: "2f2f576b-185e-4521-aa1a-9ffc285015ea" },
  { id: "aunt-cass", projectId: "f04ddfbb-bc77-4c56-acc5-d0a97ff88b6e" },
];

const OUT = process.env.SFM_CANDIDATES_DIR ?? "/opt/cursor/artifacts/sfm-model-candidates";

async function collectPreviewUrls(page) {
  const toggle = page.locator('a[data-action="toggle-gallery"], a:has-text("Show more")').first();
  if (await toggle.count()) {
    try {
      await toggle.click({ timeout: 5000 });
      await page.waitForTimeout(800);
    } catch {
      /* optional gallery */
    }
  }
  const urls = await page.$$eval("img", (imgs) =>
    imgs
      .map((img) => img.src || img.getAttribute("src") || "")
      .filter((s) => s.includes("thumbcdn.open3dlab.com") && !s.includes("newsvideo")),
  );
  const itemThumb = await page.$$eval('meta[property="og:image"]', (els) =>
    els.map((e) => e.getAttribute("content") || "").filter(Boolean),
  );
  const merged = [...new Set([...urls, ...itemThumb])];
  return merged.filter((u) => /\.(png|webp|jpg|jpeg)/i.test(u) || u.includes("_thumb"));
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const manifest = [];

  for (const model of MODELS) {
    const page = await context.newPage();
    const projectUrl = `https://smutba.se/project/${model.projectId}/`;
    console.log(`\n=== ${model.id} ===`);
    try {
      await page.goto(projectUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.waitForTimeout(12000);
      const urls = await collectPreviewUrls(page);
      const dir = path.join(OUT, model.id);
      await mkdir(dir, { recursive: true });
      const entries = [];
      let i = 0;
      for (const url of urls.slice(0, 8)) {
        i += 1;
        const ext = url.includes(".webp") ? "webp" : "png";
        const file = `candidate-${i}.${ext}`;
        const dest = path.join(dir, file);
        try {
          await download(url, dest);
          entries.push({ file, sourceUrl: url });
          console.log(`  saved ${file}`);
        } catch (err) {
          console.log(`  skip ${url}: ${err.message}`);
        }
      }
      await page.screenshot({ path: path.join(dir, "page.png"), fullPage: false });
      manifest.push({ ...model, projectUrl, candidates: entries });
    } catch (err) {
      console.log(`  FAIL: ${err.message}`);
      manifest.push({ ...model, projectUrl, error: String(err.message), candidates: [] });
    }
    await page.close();
  }

  await browser.close();
  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nWrote ${OUT}/manifest.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
