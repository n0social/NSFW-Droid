/**
 * Build interactive SFW MVP pick sheet (radio per row + submit via tunnel server).
 * Replaces NSFW SmutBase gallery picks for retry workflows.
 *
 * Usage: node scripts/build-sfm-model-sfw-pick-submit.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCES = path.join(__dirname, "sfm-model-sfw-sources.json");
const MVP_ROOT = "/opt/cursor/artifacts/sfm-model-mvp-sfw";
const OUT = "/opt/cursor/artifacts/sfm-model-pick-submit.html";

const CURATED_ORDER = [
  "tifa-lockhart",
  "widowmaker",
  "d-va",
  "2b",
  "tracer",
  "mercy",
  "lady-dimitrescu",
  "jill-valentine",
  "lara-croft",
  "aunt-cass",
];

/** @typedef {{ key: string, label: string, imgSrc: string, note?: string }} PickCandidate */

function steamAppId(sourceUrl) {
  if (!sourceUrl) return null;
  const m = sourceUrl.match(/steam\/apps\/(\d+)\//);
  return m ? m[1] : null;
}

function buildCandidates(entry) {
  const id = entry.id;
  const rel = `sfm-model-mvp-sfw/${id}`;
  const webp = `${rel}/${id}.webp`;
  const sourceExt = entry.id === "aunt-cass" || !entry.sourceUrl ? "png" : "jpg";
  const source = `${rel}/source.${sourceExt}`;

  /** @type {PickCandidate[]} */
  const list = [
    {
      key: "candidate-1",
      label: "Card (production)",
      imgSrc: webp,
      note: "600×800 WebP in public/creator-models",
    },
    {
      key: "candidate-2",
      label: "Raw source",
      imgSrc: source,
      note: entry.sourceUrl ? "Downloaded marketing asset" : "Generated silhouette",
    },
  ];

  if (Array.isArray(entry.alternates) && entry.alternates.length) {
    for (const alt of entry.alternates) {
      list.push({
        key: alt.key,
        label: alt.label,
        imgSrc: alt.url,
        note: alt.note,
      });
    }
  } else {
    const appId = steamAppId(entry.sourceUrl);
    if (appId) {
      const cdn = "https://cdn.akamai.steamstatic.com/steam/apps";
      list.push(
        {
          key: "candidate-3",
          label: "Steam library 1×",
          imgSrc: `${cdn}/${appId}/library_600x900.jpg`,
          note: "Alternate vertical crop",
        },
        {
          key: "candidate-4",
          label: "Steam header",
          imgSrc: `${cdn}/${appId}/header.jpg`,
          note: "Wide header art",
        },
      );
    } else if (entry.sourceUrl && entry.sourceUrl.includes("blz-contentstack")) {
      list.push({
        key: "candidate-3",
        label: "Blizzard CDN (full)",
        imgSrc: entry.sourceUrl,
        note: "Same hero key art at source resolution",
      });
    }
  }

  return list;
}

const sources = JSON.parse(await readFile(SOURCES, "utf8"));
const byId = new Map(sources.map((s) => [s.id, s]));

const ordered = CURATED_ORDER.map((id) => {
  const entry = byId.get(id);
  if (!entry) throw new Error(`Missing source entry for ${id}`);
  return { entry, candidates: buildCandidates(entry) };
});

const maxCandidates = Math.max(...ordered.map((r) => r.candidates.length), 0);

const headerCols = Array.from({ length: maxCandidates }, (_, i) => {
  const n = i + 1;
  return `<th scope="col">candidate-${n}</th>`;
}).join("\n");

const rows = ordered
  .map(({ entry, candidates }) => {
    const cells = Array.from({ length: maxCandidates }, (_, i) => {
      const c = candidates[i];
      if (!c) return `<td class="empty">—</td>`;
      const note = c.note ? `<span class="sub">${c.note}</span>` : "";
      const external = c.imgSrc.startsWith("http") ? ' crossorigin="anonymous"' : "";
      return `
        <td class="pick-cell">
          <label>
            <input type="radio" name="pick-${entry.id}" value="${c.key}" required />
            <span class="num">${c.label}</span>
            <img src="${c.imgSrc}" alt="${c.key}" loading="lazy"${external} />
            ${note}
          </label>
          ${entry.sourcePage ? `<a class="orig" href="${entry.sourcePage}" target="_blank" rel="noopener">source page</a>` : ""}
        </td>`;
    }).join("\n");
    return `
      <tr data-character="${entry.id}">
        <th scope="row" class="char">
          <code>${entry.id}</code>
          <span class="name">${entry.characterName}</span>
        </th>
        ${cells}
      </tr>`;
  })
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SFM model picks — SFW MVP submit</title>
  <style>
    :root { color-scheme: dark; }
    body { font-family: system-ui, sans-serif; background: #14061c; color: #f5e6ff; margin: 0; padding: 1rem 1.25rem 2rem; }
    h1 { font-size: 1.35rem; margin-bottom: 0.25rem; }
    .hint { background: #241033; border-radius: 10px; padding: 0.85rem 1rem; font-size: 14px; line-height: 1.5; max-width: 960px; }
    .hint code { background: #0d0614; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    form { margin-top: 1.25rem; overflow-x: auto; }
    table.picks { border-collapse: collapse; font-size: 12px; min-width: 100%; }
    table.picks th, table.picks td { border: 1px solid #4a1d6a; padding: 0.35rem; vertical-align: top; text-align: center; }
    table.picks th.char { text-align: left; min-width: 140px; background: #241033; position: sticky; left: 0; z-index: 1; }
    table.picks th.char .name { display: block; font-size: 11px; color: #c4b5fd; font-weight: 400; margin-top: 0.2rem; }
    table.picks thead th { background: #2d1540; position: sticky; top: 0; z-index: 2; }
    table.picks thead th.char { z-index: 3; }
    td.empty { color: #6b7280; }
    label { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; cursor: pointer; max-width: 120px; }
    label input { margin: 0; accent-color: #ff4d8d; }
    .num { font-weight: 700; color: #f9a8d4; font-size: 10px; text-align: center; line-height: 1.2; }
    img { width: 88px; height: 120px; object-fit: cover; object-position: top center; background: repeating-conic-gradient(#1a1028 0% 25%, #2a1840 0% 50%) 50% / 12px 12px; border-radius: 6px; }
    .sub, a.orig { font-size: 9px; color: #c4b5fd; line-height: 1.3; }
    a.orig { display: block; margin-top: 0.2rem; }
    .actions { margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
    button[type="submit"] {
      background: linear-gradient(135deg, #ff4d8d, #a855f7);
      border: none; color: #fff; font-weight: 600;
      padding: 0.65rem 1.25rem; border-radius: 8px; cursor: pointer; font-size: 15px;
    }
    button[type="submit"]:disabled { opacity: 0.5; cursor: wait; }
    #result { margin-top: 1rem; max-width: 960px; display: none; }
    #result.visible { display: block; }
    #result pre, #result textarea {
      width: 100%; box-sizing: border-box;
      background: #0d0614; border: 1px solid #4a1d6a; border-radius: 8px;
      color: #e9d5ff; padding: 0.75rem; font-size: 12px; font-family: ui-monospace, monospace;
    }
    #result .ok { color: #86efac; font-size: 14px; margin-bottom: 0.5rem; }
    #result .err { color: #fca5a5; }
    label:has(input:checked) img { outline: 3px solid #ff4d8d; outline-offset: 2px; }
  </style>
</head>
<body>
  <h1>SFM model hub — SFW MVP picks (retry)</h1>
  <div class="hint">
    <p><strong>SFW only.</strong> Pick one option per character for the creator-hub card image.
    Columns are <code>candidate-1</code> (production WebP), <code>candidate-2</code> (raw source), then Steam/Blizzard alternates where available.</p>
    <p>Submit saves to <code>/opt/cursor/artifacts/sfm-model-picks-submitted.json</code> via <code>POST /api/pick</code>.</p>
  </div>
  <form id="pick-form">
    <table class="picks">
      <thead>
        <tr>
          <th scope="col" class="char">Character</th>
          ${headerCols}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <div class="actions">
      <button type="submit" id="submit-btn">Submit picks</button>
      <span id="status" aria-live="polite"></span>
    </div>
  </form>
  <div id="result">
    <p class="ok" id="result-msg"></p>
    <p><strong>Paste into agent chat:</strong></p>
    <textarea id="paste-block" rows="12" readonly></textarea>
    <p><strong>JSON</strong></p>
    <pre id="json-block"></pre>
  </div>
  <script>
    const form = document.getElementById("pick-form");
    const result = document.getElementById("result");
    const pasteBlock = document.getElementById("paste-block");
    const jsonBlock = document.getElementById("json-block");
    const resultMsg = document.getElementById("result-msg");
    const status = document.getElementById("status");
    const submitBtn = document.getElementById("submit-btn");

    function collectPicks() {
      const picks = {};
      for (const row of form.querySelectorAll("tr[data-character]")) {
        const id = row.dataset.character;
        const checked = row.querySelector('input[type="radio"]:checked');
        if (!checked) throw new Error("Missing pick for " + id);
        picks[id] = checked.value;
      }
      return picks;
    }

    function formatPaste(picks) {
      return Object.entries(picks)
        .map(([id, v]) => id + ": " + v)
        .join("\\n");
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.textContent = "";
      result.classList.remove("visible");
      submitBtn.disabled = true;
      try {
        const picks = collectPicks();
        const body = { picks, submittedAt: new Date().toISOString(), workflow: "sfw-mvp" };
        const res = await fetch("/api/pick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || res.statusText || "Submit failed");
        pasteBlock.value = formatPaste(picks);
        jsonBlock.textContent = JSON.stringify(data.saved || body, null, 2);
        resultMsg.textContent = data.message || "Saved — copy the block below into chat.";
        resultMsg.className = "ok";
        result.classList.add("visible");
        status.textContent = "Saved.";
      } catch (err) {
        resultMsg.textContent = String(err.message || err);
        resultMsg.className = "err";
        result.classList.add("visible");
        status.textContent = "Error.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  </script>
</body>
</html>`;

await writeFile(OUT, html);
console.log("Wrote", OUT);
console.log(
  "Rows:",
  ordered.map((r) => `${r.entry.id} (${r.candidates.length} options)`).join(", "),
);
