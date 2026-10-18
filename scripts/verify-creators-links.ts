/**
 * HEAD/GET every outbound href in src/lib/creators-curated.ts.
 * Exit 1 if any link fails (404, DNS, etc.). Rate-limited itch may show 429 — treated as OK.
 *
 * Usage: npx tsx scripts/verify-creators-links.ts
 */
import { CURATED_SFM_TUTORIALS } from "../src/lib/creator-assets-sfm-tutorials-curated";
import { CURATED_COMMUNITY_LINKS } from "../src/lib/community-links-curated";
import { CURATED_GAMES, CURATED_STUDIOS } from "../src/lib/creators-curated";
import { USER_AGENT } from "./lib/ingest-common";

type Row = {
  kind: "studio" | "game" | "community" | "sfm-tutorial";
  id: string;
  label: string;
  href: string;
};

const TIMEOUT_MS = Number(process.env.LINK_CHECK_TIMEOUT_MS ?? "15000");

/** Hosts that often return 403 to automated probes but work in a normal browser. */
const BOT_WALL_HOSTS = new Set([
  "hanime.tv",
  "nhentai.net",
  "iwara.tv",
  "sfmlab.com",
  "smutba.se",
  "steamcommunity.com",
  "youtube.com",
  "www.youtube.com",
  "inletzone.com",
]);

function rows(): Row[] {
  const studios = CURATED_STUDIOS.map((s) => ({
    kind: "studio" as const,
    id: s.id,
    label: s.name,
    href: s.href,
  }));
  const games = CURATED_GAMES.map((g) => ({
    kind: "game" as const,
    id: g.id,
    label: g.title,
    href: g.href,
  }));
  const community = CURATED_COMMUNITY_LINKS.map((l) => ({
    kind: "community" as const,
    id: l.id,
    label: l.name,
    href: l.href,
  }));
  const sfmTutorials = CURATED_SFM_TUTORIALS.map((t) => ({
    kind: "sfm-tutorial" as const,
    id: t.id,
    label: t.name,
    href: t.href,
  }));
  return [...studios, ...games, ...community, ...sfmTutorials];
}

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
  const list = rows();
  let failed = 0;

  for (const row of list) {
    const result = await probe(row.href);
    const redirect =
      result.final && result.final !== row.href ? ` → ${result.final}` : "";
    const status = result.status ?? result.error ?? "?";
    const mark = result.ok ? "ok" : "FAIL";
    console.log(`${mark}\t${row.kind}\t${row.id}\t${status}\t${row.label}\t${row.href}${redirect}`);
    if (!result.ok) failed += 1;
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\nChecked ${list.length} links; ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
