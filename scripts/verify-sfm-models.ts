/**
 * Verify SmutBase / SFMLab project URLs for curated SFM models.
 * Usage: npx tsx scripts/verify-sfm-models.ts
 */
import { TOP_SFM_MODELS, smutbaseHref } from "../src/lib/sfm-models-curated";
import { smutbaseProjectUrl } from "../src/lib/smutbase-url";
import { USER_AGENT } from "./lib/ingest-common";

const TIMEOUT_MS = Number(process.env.LINK_CHECK_TIMEOUT_MS ?? "20000");

async function probe(url: string): Promise<{ ok: boolean; status?: number; final?: string; title?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: controller.signal,
    });
    const html = await res.text();
    const title = html.match(/property="og:title"\s+content="([^"]+)"/i)?.[1];
    const ok = res.ok || res.status < 400 || res.status === 403;
    return { ok, status: res.status, final: res.url, title };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

/** Project titles that omit the card name but are the intended pick. */
const TITLE_ALIASES: Record<string, string[]> = {
  "d-va": ["dva", "d va"],
  "2b": ["yo rha", "type b", "2b", "no 2"],
  "lady-dimitrescu": ["dimitrescu", "alcina"],
};

function titleMatchesCharacter(modelId: string, characterName: string, title: string | undefined): boolean {
  if (!title) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const page = norm(title);
  const needles = [norm(characterName), ...(TITLE_ALIASES[modelId] ?? [])];
  if (needles.some((n) => n && page.includes(n))) return true;
  const last = norm(characterName).split(" ").pop();
  return Boolean(last && last.length > 2 && page.includes(last));
}

async function main() {
  let failed = 0;
  for (const model of TOP_SFM_MODELS) {
    const smut = smutbaseHref(model);
    const expected = smutbaseProjectUrl(model.projectId);
    if (smut !== expected) {
      console.log(`FAIL\t${model.id}\tbad href\texpected ${expected} got ${smut}`);
      failed += 1;
      continue;
    }
    if (!smut.startsWith("https://smutba.se/project/")) {
      console.log(`FAIL\t${model.id}\thref must use smutba.se\t${smut}`);
      failed += 1;
      continue;
    }

    const smutRes = await probe(smut);
    const titleOk = titleMatchesCharacter(model.id, model.characterName, smutRes.title);
    const mark = smutRes.ok && titleOk ? "ok" : "FAIL";
    console.log(
      `${mark}\t${model.id}\t${smutRes.status ?? "?"}\t${model.characterName}\t${smutRes.title ?? "(no title)"}\t→ ${smutRes.final ?? ""}`,
    );
    if (!smutRes.ok || !titleOk) failed += 1;
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log(`\nChecked ${TOP_SFM_MODELS.length} models; ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
