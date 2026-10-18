/**
 * Verify SmutBase / SFMLab project URLs for curated SFM models.
 * Usage: npx tsx scripts/verify-sfm-models.ts
 */
import { TOP_SFM_MODELS, smutbaseHref } from "../src/lib/sfm-models-curated";
import { smutbaseProjectUrl, sfmlabProjectUrl } from "../src/lib/smutbase-url";
import { USER_AGENT } from "./lib/ingest-common";

const TIMEOUT_MS = Number(process.env.LINK_CHECK_TIMEOUT_MS ?? "20000");

async function probe(url: string): Promise<{ ok: boolean; status?: number; final?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: controller.signal,
    });
    if (res.status === 405 || res.status === 501) {
      const getRes = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
        signal: controller.signal,
      });
      return { ok: getRes.ok || getRes.status < 400, status: getRes.status, final: getRes.url };
    }
    const ok = res.ok || (res.status >= 300 && res.status < 400) || res.status === 403;
    return { ok, status: res.status, final: res.url };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  let failed = 0;
  for (const model of TOP_SFM_MODELS) {
    const smut = smutbaseHref(model);
    const smutRes = await probe(smut);
    const mark = smutRes.ok ? "ok" : "FAIL";
    console.log(
      `${mark}\t${model.id}\t${smutRes.status ?? "?"}\t${model.characterName}\t${smut}\t→ ${smutRes.final ?? ""}`,
    );
    if (!smutRes.ok) failed += 1;
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log(`\nChecked ${TOP_SFM_MODELS.length} models; ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
