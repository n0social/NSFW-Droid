/**
 * Build HTML pick sheet for SFM model showcase candidates.
 * Usage: node scripts/build-sfm-model-pick-gallery.mjs
 *
 * Reads scraped candidates from artifacts (not committed to git).
 * Open the output HTML via file:// or serve /opt/cursor/artifacts/ locally.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = "/opt/cursor/artifacts/sfm-model-candidates";
const NOBG = "/opt/cursor/artifacts/sfm-model-candidates-nobg";
const OUT = "/opt/cursor/artifacts/sfm-model-pick-review.html";

const manifest = JSON.parse(await readFile(path.join(ROOT, "manifest.json"), "utf8"));

const folderRow = (m) => {
  const n = (m.candidates ?? []).length;
  const origDir = `${ROOT}/${m.id}/`;
  const nobgDir = `${NOBG}/${m.id}/`;
  return { id: m.id, n, origDir, nobgDir };
};

const folders = manifest.map(folderRow);

const toc = folders
  .map(
    (f) =>
      `<li><a href="#${f.id}"><code>${f.id}</code></a> — ${f.n} candidate${f.n === 1 ? "" : "s"}</li>`,
  )
  .join("\n");

const folderTable = folders
  .map(
    (f) => `
    <tr>
      <td><code>${f.id}</code></td>
      <td>${f.n}</td>
      <td><code class="path">${f.origDir}</code></td>
      <td><code class="path">${f.nobgDir}</code></td>
    </tr>`,
  )
  .join("\n");

const sections = manifest
  .map((m) => {
    const f = folderRow(m);
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
          <p class="paths"><code>${f.origDir}${c.file}</code></p>
          <p class="src"><a href="${c.sourceUrl}" target="_blank" rel="noopener">Source thumb</a></p>
        </figure>`;
      })
      .join("\n");
    return `
    <section id="${m.id}">
      <h2>${m.id.replace(/-/g, " ")}</h2>
      <p class="meta"><a href="${m.projectUrl}">SmutBase project</a></p>
      <p class="folder-meta">
        <strong>Folders:</strong>
        <code class="path">${f.origDir}</code> ·
        <code class="path">${f.nobgDir}</code>
        (${f.n} file${f.n === 1 ? "" : "s"} each)
      </p>
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
    body { font-family: system-ui, sans-serif; background: #14061c; color: #f5e6ff; margin: 0; padding: 1.5rem; max-width: 1200px; }
    h1 { font-size: 1.4rem; }
    section { margin: 2.5rem 0; border-top: 1px solid #4a1d6a; padding-top: 1.5rem; }
    h2 { text-transform: capitalize; color: #ff4d8d; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .card { background: #241033; border-radius: 12px; padding: 0.75rem; }
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .pair span { font-size: 10px; text-transform: uppercase; color: #c4b5fd; }
    img { width: 100%; height: 220px; object-fit: contain; background: repeating-conic-gradient(#1a1028 0% 25%, #2a1840 0% 50%) 50% / 16px 16px; border-radius: 8px; }
    .src a { font-size: 11px; color: #f9a8d4; }
    .paths code, .pick code, code.path { background: #0d0614; padding: 2px 6px; border-radius: 4px; font-size: 11px; word-break: break-all; }
    .meta a { color: #e9d5ff; font-size: 12px; }
    .folder-meta { font-size: 12px; color: #d8b4fe; line-height: 1.6; }
    .toc { columns: 2; font-size: 13px; }
    table.folders { width: 100%; border-collapse: collapse; font-size: 12px; margin: 1rem 0; }
    table.folders th, table.folders td { border: 1px solid #4a1d6a; padding: 0.4rem 0.5rem; text-align: left; vertical-align: top; }
    table.folders th { background: #241033; }
    .hint { background: #241033; border-radius: 8px; padding: 1rem; margin: 1rem 0; font-size: 14px; }
  </style>
</head>
<body>
  <h1>SFM model showcase — candidate picks</h1>
  <div class="hint">
    <p><strong>How to pick:</strong> Choose <strong>one</strong> <code>candidate-N</code> per character (NSFW, standing/full-body if possible).
    Reply to the agent with lines like <code>tifa-lockhart: candidate-2</code>.
    Winners are exported to <code>public/creator-models/{id}.webp</code> in the repo.</p>
    <p><strong>Gallery file:</strong> <code>${OUT}</code></p>
  </div>
  <h2 id="toc">All models (${folders.length})</h2>
  <ul class="toc">${toc}</ul>
  <h3>Folder paths</h3>
  <table class="folders">
    <thead><tr><th>Character id</th><th>#</th><th>Originals</th><th>No-background</th></tr></thead>
    <tbody>${folderTable}</tbody>
  </table>
  <p>Previews pulled from each model&apos;s SmutBase project gallery. Background removed for showcase cards.</p>
  ${sections}
</body>
</html>`;

await writeFile(OUT, html);
console.log("Wrote", OUT);
console.log(
  "Candidates:",
  folders.map((f) => `${f.id}=${f.n}`).join(", "),
);
