/**
 * Job 5: link health — HEAD/GET official_url and affiliate_url on listings.
 * Dry-run by default; pass --apply to persist link_status.
 *
 * Env:
 *   LINK_CHECK_LIMIT — max listings per run (default 80; 0 = no cap)
 *   LINK_CHECK_DELAY_MS — pause between listings (default 400)
 *   LINK_CHECK_TIMEOUT_MS — per-request timeout (default 15000)
 *   LINK_CHECK_ONLY_OK — if 1, only check rows already link_status=ok (default 1)
 */
import "dotenv/config";
import { and, asc, eq } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";
import { listings } from "../src/db/schema";
import { recordIngestRun } from "../src/lib/ingest-run";
import { USER_AGENT } from "./lib/ingest-common";

type UrlCheck = { url: string; ok: boolean; status?: number; error?: string };

function limit(): number {
  const n = Number(process.env.LINK_CHECK_LIMIT ?? "80");
  if (!Number.isFinite(n) || n < 0) return 80;
  return Math.floor(n);
}

function delayMs() {
  return Number(process.env.LINK_CHECK_DELAY_MS ?? "400");
}

function timeoutMs() {
  return Number(process.env.LINK_CHECK_TIMEOUT_MS ?? "15000");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Itch often answers the droplet with 403. That is a block, not a dead page. */
export function linkProbeIsInconclusive(status: number): boolean {
  return status === 403 || status === 429;
}

async function probeUrl(url: string): Promise<UrlCheck> {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return { url: trimmed, ok: false, error: "invalid_url" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());

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
    if (linkProbeIsInconclusive(res.status)) {
      return { url: trimmed, ok: true, status: res.status, error: "inconclusive_skip" };
    }
    const ok = res.ok || (res.status >= 300 && res.status < 400);
    return { url: trimmed, ok, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { url: trimmed, ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

async function listingUrls(
  row: { officialUrl: string; affiliateUrl: string | null },
): Promise<string[]> {
  const urls: string[] = [];
  const official = row.officialUrl?.trim();
  if (official) urls.push(official);
  const aff = row.affiliateUrl?.trim();
  if (aff && aff !== official) urls.push(aff);
  return urls;
}

async function main() {
  const startedAt = new Date();
  const apply = process.argv.includes("--apply");
  const maxRows = limit();
  const onlyOk = process.env.LINK_CHECK_ONLY_OK !== "0";

  const db = await getDb();
  const where = onlyOk
    ? and(eq(listings.catalogStale, false), eq(listings.linkStatus, "ok"))
    : eq(listings.catalogStale, false);

  const baseQuery = db
    .select()
    .from(listings)
    .where(where)
    .orderBy(asc(listings.updatedAt));
  const rows = maxRows > 0 ? await baseQuery.limit(maxRows) : await baseQuery;

  let checked = 0;
  let markedBroken = 0;
  let markedOk = 0;
  let skippedRateLimit = 0;
  const brokenSamples: { id: string; title: string; checks: UrlCheck[] }[] = [];

  for (const row of rows) {
    const urls = await listingUrls(row);
    if (!urls.length) continue;

    const checks: UrlCheck[] = [];
    let hardFail = false;
    for (const url of urls) {
      const c = await probeUrl(url);
      checks.push(c);
      if (c.error === "inconclusive_skip" || c.error === "rate_limited_skip") {
        skippedRateLimit += 1;
        continue;
      }
      if (!c.ok) hardFail = true;
      await sleep(Math.min(delayMs(), 200));
    }

    checked += 1;
    if (
      checks.some((c) => c.error === "inconclusive_skip" || c.error === "rate_limited_skip") &&
      !hardFail
    ) {
      await sleep(delayMs());
      continue;
    }

    const nextStatus = hardFail ? "broken" : "ok";
    if (hardFail && brokenSamples.length < 15) {
      brokenSamples.push({ id: row.id, title: row.title, checks });
    }

    if (apply && row.linkStatus !== nextStatus) {
      await db
        .update(listings)
        .set({ linkStatus: nextStatus, updatedAt: new Date() })
        .where(eq(listings.id, row.id));
      if (nextStatus === "broken") markedBroken += 1;
      else markedOk += 1;
    } else if (apply && nextStatus === "broken" && row.linkStatus === "broken") {
      /* unchanged */
    } else if (!apply && hardFail) {
      markedBroken += 1;
    }

    await sleep(delayMs());
  }

  const summary = {
    apply,
    onlyOk,
    limit: maxRows,
    candidates: rows.length,
    checked,
    wouldOrDidMarkBroken: markedBroken,
    restoredOk: markedOk,
    skippedRateLimit,
    brokenSamples,
  };

  console.log(JSON.stringify(summary, null, 2));

  await recordIngestRun({
    job: "link_health",
    status: "ok",
    startedAt,
    finishedAt: new Date(),
    summary,
  });

  await closeCatalogDb();
}

const invokedDirectly = process.argv[1]?.includes("check-listing-links");
if (invokedDirectly) {
main().catch(async (e) => {
  console.error(e);
  await recordIngestRun({
    job: "link_health",
    status: "error",
    startedAt: new Date(),
    errorMessage: e instanceof Error ? e.message : String(e),
  }).catch(() => {});
  process.exit(1);
});
}
