/**
 * Serve SFM pick UI + candidate images; POST /api/pick writes submitted JSON.
 * Usage: node scripts/sfm-model-pick-server.mjs
 * Env: PICK_PORT (default 8787), ARTIFACTS_ROOT (default /opt/cursor/artifacts)
 */
import http from "node:http";
import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { URL } from "node:url";

const ARTIFACTS = process.env.ARTIFACTS_ROOT || "/opt/cursor/artifacts";
const PORT = Number(process.env.PICK_PORT || 8787);
const SUBMIT_FILE = path.join(ARTIFACTS, "sfm-model-picks-submitted.json");
const PICK_PAGE = "sfm-model-pick-submit.html";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
};

async function readBody(req, limit = 1_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error("Body too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function serveStatic(filePath, res) {
  const st = await stat(filePath);
  if (!st.isFile()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const data = await readFile(filePath);
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "public, max-age=300" });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = decodeURIComponent(url.pathname);

    if (req.method === "POST" && pathname === "/api/pick") {
      const raw = await readBody(req);
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const picks = payload?.picks;
      if (!picks || typeof picks !== "object" || Array.isArray(picks)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Expected { picks: { id: candidate-N } }" }));
        return;
      }
      const saved = {
        picks,
        submittedAt: payload.submittedAt || new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      };
      await writeFile(SUBMIT_FILE, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ok: true,
          message: `Wrote ${SUBMIT_FILE}`,
          saved,
        }),
      );
      console.log("[pick]", JSON.stringify(saved.picks));
      return;
    }

    if (req.method === "GET" && (pathname === "/" || pathname === "/pick")) {
      res.writeHead(302, { Location: `/${PICK_PAGE}` });
      res.end();
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end("Method not allowed");
      return;
    }

    const rel = pathname.replace(/^\/+/, "");
    const safe = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, "");
    const filePath = path.join(ARTIFACTS, safe);
    if (!filePath.startsWith(ARTIFACTS)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (req.method === "HEAD") {
      await stat(filePath);
      res.writeHead(200);
      res.end();
      return;
    }

    await serveStatic(filePath, res);
  } catch (err) {
    if (err && err.code === "ENOENT") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    console.error(err);
    res.writeHead(500);
    res.end("Server error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SFM pick server http://0.0.0.0:${PORT}/`);
  console.log(`Pick UI: http://127.0.0.1:${PORT}/${PICK_PAGE}`);
  console.log(`Artifacts root: ${ARTIFACTS}`);
  console.log(`Submit writes: ${SUBMIT_FILE}`);
});
