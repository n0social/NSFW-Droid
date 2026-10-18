import { CURATED_SFM_TUTORIALS } from "../src/lib/creator-assets-sfm-tutorials-curated";
import { USER_AGENT } from "./lib/ingest-common";

const TIMEOUT_MS = Number(process.env.LINK_CHECK_TIMEOUT_MS ?? "15000");
const BOT_WALL_HOSTS = new Set([
  "smutba.se",
  "sfmlab.com",
  "steamcommunity.com",
  "youtube.com",
  "www.youtube.com",
  "inletzone.com",
]);

async function probe(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: controller.signal,
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
        signal: controller.signal,
      });
    }
    if (res.status === 429) return { ok: true, status: 429 };
    let hostname = "";
    try {
      hostname = new URL(res.url || url).hostname.replace(/^www\./, "");
    } catch {
      /* ignore */
    }
    if ((res.status === 403 || res.status === 401) && BOT_WALL_HOSTS.has(hostname)) {
      return { ok: true, status: res.status };
    }
    return { ok: res.ok || res.status < 400, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  let failed = 0;
  for (const row of CURATED_SFM_TUTORIALS) {
    const result = await probe(row.href);
    console.log(`${result.ok ? "ok" : "FAIL"}\t${row.id}\t${result.status ?? result.error}\t${row.name}`);
    if (!result.ok) failed += 1;
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`\nChecked ${CURATED_SFM_TUTORIALS.length}; ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
