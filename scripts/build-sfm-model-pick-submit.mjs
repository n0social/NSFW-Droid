/**
 * Build interactive SFM model pick sheet (radio per row + submit).
 * Usage: node scripts/build-sfm-model-pick-submit.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = "/opt/cursor/artifacts/sfm-model-candidates";
const NOBG = "/opt/cursor/artifacts/sfm-model-candidates-nobg";
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

const manifest = JSON.parse(await readFile(path.join(ROOT, "manifest.json"), "utf8"));
const byId = new Map(manifest.map((m) => [m.id, m]));

const ordered = CURATED_ORDER.map((id) => {
  const m = byId.get(id);
  if (!m) throw new Error(`Missing manifest entry for ${id}`);
  return m;
});

const maxCandidates = Math.max(...ordered.map((m) => (m.candidates ?? []).length), 0);

const headerCols = Array.from({ length: maxCandidates }, (_, i) => {
  const n = i + 1;
  return `<th scope="col">candidate-${n}</th>`;
}).join("\n");

const rows = ordered
  .map((m) => {
    const cells = Array.from({ length: maxCandidates }, (_, i) => {
      const c = m.candidates?.[i];
      if (!c) return `<td class="empty">—</td>`;
      const n = i + 1;
      const nobg = `sfm-model-candidates-nobg/${m.id}/candidate-${n}.png`;
      const orig = `sfm-model-candidates/${m.id}/${c.file}`;
      return `
        <td class="pick-cell">
          <label>
            <input type="radio" name="pick-${m.id}" value="candidate-${n}" required />
            <span class="num">#${n}</span>
            <img src="${nobg}" alt="candidate-${n}" loading="lazy" />
            <span class="sub">no-bg</span>
          </label>
          <a class="orig" href="${orig}" target="_blank" rel="noopener">original</a>
        </td>`;
    }).join("\n");
    return `
      <tr data-character="${m.id}">
        <th scope="row" class="char">
          <code>${m.id}</code>
          <a href="${m.projectUrl}" target="_blank" rel="noopener">project</a>
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
  <title>SFM model picks — submit</title>
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
    table.picks thead th { background: #2d1540; position: sticky; top: 0; z-index: 2; }
    table.picks thead th.char { z-index: 3; }
    td.empty { color: #6b7280; }
    label { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; cursor: pointer; }
    label input { margin: 0; accent-color: #ff4d8d; }
    .num { font-weight: 700; color: #f9a8d4; font-size: 11px; }
    img { width: 88px; height: 120px; object-fit: contain; background: repeating-conic-gradient(#1a1028 0% 25%, #2a1840 0% 50%) 50% / 12px 12px; border-radius: 6px; }
    .sub, a.orig { font-size: 10px; color: #c4b5fd; }
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
  <h1>SFM model showcase — pick one per character</h1>
  <div class="hint">
    <p>Select <strong>one numbered candidate</strong> per row (NSFW / standing full-body preferred), then <strong>Submit picks</strong>.
    Choices are saved to <code>/opt/cursor/artifacts/sfm-model-picks-submitted.json</code> and shown below for copy-paste into chat.</p>
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
        const body = { picks, submittedAt: new Date().toISOString() };
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
console.log("Characters:", ordered.map((m) => m.id).join(", "));
