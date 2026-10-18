/**
 * Optional review page for SFW MVP picks (one image per character, no tunnel required).
 * Usage: node scripts/build-sfm-model-sfw-pick-review.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ARTIFACT = "/opt/cursor/artifacts/sfm-model-mvp-sfw";
const OUT = "/opt/cursor/artifacts/sfm-model-sfw-mvp-review.html";

const manifest = JSON.parse(await readFile(path.join(ARTIFACT, "manifest.json"), "utf8"));

const cards = manifest
  .map(
    (m) => `
    <article class="card">
      <h2>${m.characterName}</h2>
      <p class="id"><code>${m.id}</code></p>
      <img src="sfm-model-mvp-sfw/${m.id}/${m.id}.webp" alt="${m.characterName} SFW preview" width="200" height="267" loading="lazy" />
      <p class="lic">${m.licenseNote}</p>
      <p><a href="${m.sourcePage}" target="_blank" rel="noopener">Source page</a></p>
      ${m.sourceUrl ? `<p class="url"><a href="${m.sourceUrl}" target="_blank" rel="noopener">Image URL</a></p>` : ""}
    </article>`,
  )
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SFM models — SFW MVP previews</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #14061c; color: #f5e6ff; padding: 1.5rem; }
    h1 { font-size: 1.35rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-top: 1rem; }
    .card { background: #241033; border-radius: 12px; padding: 0.75rem; font-size: 13px; }
    .card h2 { margin: 0 0 0.25rem; font-size: 1rem; color: #ff4d8d; }
    .id code { background: #0d0614; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
    img { width: 100%; border-radius: 8px; margin: 0.5rem 0; }
    .lic { color: #c4b5fd; font-size: 11px; line-height: 1.4; }
    a { color: #f9a8d4; }
    .hint { background: #241033; padding: 1rem; border-radius: 8px; max-width: 720px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>SFM model hub — SFW MVP card images</h1>
  <div class="hint">
    Auto-selected one SFW image per character. Production paths: <code>public/creator-models/{id}.webp</code>.
    Re-fetch with <code>node scripts/fetch-sfm-model-sfw-mvp.mjs</code>. Sources: <code>scripts/sfm-model-sfw-sources.json</code>.
  </div>
  <div class="grid">${cards}</div>
</body>
</html>`;

await writeFile(OUT, html);
console.log("Wrote", OUT);
