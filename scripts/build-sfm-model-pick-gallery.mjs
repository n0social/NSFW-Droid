/**
 * Build HTML pick sheet for SFM model showcase candidates.
 * Usage: node scripts/build-sfm-model-pick-gallery.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = "/opt/cursor/artifacts/sfm-model-candidates";
const NOBG = "/opt/cursor/artifacts/sfm-model-candidates-nobg";
const OUT = "/opt/cursor/artifacts/sfm-model-pick-review.html";

const manifest = JSON.parse(await readFile(path.join(ROOT, "manifest.json"), "utf8"));

const sections = manifest
  .map((m) => {
    const cards = (m.candidates ?? [])
      .map((c, idx) => {
        const n = idx + 1;
        const orig = `${m.id}/${c.file}`;
        const nobg = `${m.id}/candidate-${n}.png`;
        return `
        <figure class="card">
          <figcaption><strong>candidate-${n}</strong></figcaption>
          <div class="pair">
            <div><span>Original</span><img src="sfm-model-candidates/${orig}" alt="" loading="lazy" /></div>
            <div><span>No BG (showcase)</span><img src="sfm-model-candidates-nobg/${nobg}" alt="" loading="lazy" /></div>
          </div>
          <p class="src"><a href="${c.sourceUrl}" target="_blank" rel="noopener">Source thumb</a></p>
        </figure>`;
      })
      .join("\n");
    return `
    <section id="${m.id}">
      <h2>${m.id.replace(/-/g, " ")}</h2>
      <p class="meta"><a href="${m.projectUrl}">SmutBase project</a></p>
      <div class="grid">${cards || "<p>No candidates scraped.</p>"}</div>
      <p class="pick">Reply with: <code>${m.id}: candidate-N</code> (standing nude preferred)</p>
    </section>`;
  })
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SFM model showcase — pick sheet</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #14061c; color: #f5e6ff; margin: 0; padding: 1.5rem; }
    h1 { font-size: 1.4rem; }
    section { margin: 2.5rem 0; border-top: 1px solid #4a1d6a; padding-top: 1.5rem; }
    h2 { text-transform: capitalize; color: #ff4d8d; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .card { background: #241033; border-radius: 12px; padding: 0.75rem; }
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .pair span { font-size: 10px; text-transform: uppercase; color: #c4b5fd; }
    img { width: 100%; height: 220px; object-fit: contain; background: repeating-conic-gradient(#1a1028 0% 25%, #2a1840 0% 50%) 50% / 16px 16px; border-radius: 8px; }
    .src a { font-size: 11px; color: #f9a8d4; }
    .pick code { background: #0d0614; padding: 2px 6px; border-radius: 4px; }
    .meta a { color: #e9d5ff; font-size: 12px; }
  </style>
</head>
<body>
  <h1>SFM model showcase — candidate picks</h1>
  <p>Previews pulled from each model&apos;s SmutBase project gallery. Background removed for showcase cards.
  Choose <strong>one candidate per character</strong> (NSFW + standing if possible). Tell the agent e.g. <code>tifa-lockhart: candidate-2</code>.</p>
  ${sections}
</body>
</html>`;

await writeFile(OUT, html);
console.log("Wrote", OUT);
