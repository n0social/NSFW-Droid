/**
 * HEAD/GET every outbound href in src/lib/creator-assets-blender-curated.ts.
 * Exit 1 if any link fails (404, DNS, etc.). Rate-limited itch may show 429 — treated as OK.
 *
 * Usage: npm run creators:verify-blender-assets
 */
import { CURATED_CREATOR_ASSETS_BLENDER } from "../src/lib/creator-assets-blender-curated";
import { USER_AGENT } from "./lib/ingest-common";

const TIMEOUT_MS = Number(process.env.LINK_CHECK_TIMEOUT_MS ?? "15000");

/** Hosts that often return 403 to automated probes but work in a normal browser. */
const BOT_WALL_HOSTS = new Set([
  "sfmlab.com",
  "smutba.se",
  "open3dlab.com",
  "patreon.com",
]);

async function probe(url: string): Promise<{ ok: boolean; status?: number; final?: string; error?: string }> {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return { ok: false, error: "invalid_url" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers = { "User-Agent": USER_AGENT };

  try {
    let res = await fetch(trimmed, {
      method: "HEAD",
      headers,
      redirect: "follow",
      signal: controller.signal,
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(trimmed, {
        method: "GET",
        headers,
        redirect: "follow",
        signal: controller.signal,
      });
    }
    if (res.status === 429) {
      return { ok: true, status: 429, final: res.url, error: "rate_limited_ok" };
    }
    let hostname = "";
    try {
      hostname = new URL(res.url || trimmed).hostname.replace(/^www\./, "");
    } catch {
      /* ignore */
    }
    if (res.status === 403 && BOT_WALL_HOSTS.has(hostname)) {
      return { ok: true, status: 403, final: res.url, error: "bot_wall_ok" };
    }
    const ok = res.ok || (res.status >= 300 && res.status < 400);
    return { ok, status: res.status, final: res.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  let failed = 0;

  for (const row of CURATED_CREATOR_ASSETS_BLENDER) {
    const result = await probe(row.href);
    const redirect =
      result.final && result.final !== row.href ? ` → ${result.final}` : "";
    const status = result.status ?? result.error ?? "?";
    const mark = result.ok ? "ok" : "FAIL";
    console.log(`${mark}\t${row.id}\t${status}\t${row.name}\t${row.href}${redirect}`);
    if (!result.ok) failed += 1;
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\nChecked ${CURATED_CREATOR_ASSETS_BLENDER.length} links; ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
