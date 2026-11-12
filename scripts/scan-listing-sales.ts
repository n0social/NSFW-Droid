/**
 * Daily store-sale scan. Separate from ingest.
 *
 * itch: paginate https://itch.io/games/on-sale.xml and match the game URL.
 * Steam: appdetails price_overview for catalog app ids, US dollars.
 * A failed source does not clear badges. discount 0 is not a sale.
 *
 * Dry-run by default. Pass --apply to write listing.sale_percent.
 * Run through scripts/sale-scan-cron.sh so the app is stopped around PGlite.
 */
import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";
import { listings } from "../src/db/schema";
import { recordIngestRun } from "../src/lib/ingest-run";
import {
  parseItchSaleFeed,
  planSaleWrites,
  steamSaleFromDetails,
  type ListingSaleRow,
  type SaleHit,
} from "../src/lib/sale-offer";
import { USER_AGENT, sleep } from "./lib/ingest-common";

const SOURCES = ["itch", "steam"] as const;

function itchMaxPages(): number {
  const n = Number(process.env.ITCH_SALE_MAX_PAGES ?? "45");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 45;
}

function itchDelayMs(): number {
  const n = Number(process.env.ITCH_SALE_DELAY_MS ?? "400");
  return Number.isFinite(n) && n >= 0 ? n : 400;
}

function steamDelayMs(): number {
  const n = Number(process.env.STEAM_SALE_DELAY_MS ?? process.env.STEAM_DETAIL_DELAY_MS ?? "280");
  return Number.isFinite(n) && n >= 0 ? n : 280;
}

async function fetchText(url: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, text: await res.text() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function fetchItchSales(now: number): Promise<{ ok: true; sales: Map<string, SaleHit>; pages: number } | { ok: false; error: string }> {
  const sales = new Map<string, SaleHit>();
  const maxPages = itchMaxPages();
  for (let page = 1; page <= maxPages; page += 1) {
    const url = `https://itch.io/games/on-sale.xml?page=${page}`;
    const res = await fetchText(url);
    if (!res.ok) return { ok: false, error: `itch page ${page}: ${res.error}` };
    if (!res.text.includes("<rss")) return { ok: false, error: `itch page ${page}: not rss` };
    const parsed = parseItchSaleFeed(res.text, now);
    if (parsed.itemCount === 0) {
      if (page === 1) return { ok: false, error: "itch on-sale feed was empty" };
      return { ok: true, sales, pages: page - 1 };
    }
    for (const [key, sale] of parsed.sales) sales.set(key, sale);
    if (page < maxPages) await sleep(itchDelayMs());
  }
  return { ok: false, error: `itch on-sale feed did not end within ${maxPages} pages` };
}

async function fetchSteamSale(appId: string): Promise<{ ok: true; sale: SaleHit | null } | { ok: false; error: string }> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(appId)}&cc=us&filters=price_overview`;
  const res = await fetchText(url);
  if (!res.ok) return res;
  let json: unknown;
  try {
    json = JSON.parse(res.text) as unknown;
  } catch {
    return { ok: false, error: "steam json" };
  }
  const block = json && typeof json === "object" ? (json as Record<string, { success?: boolean; data?: unknown }>)[appId] : undefined;
  if (!block?.success) return { ok: false, error: "steam details unavailable" };
  return { ok: true, sale: steamSaleFromDetails(block.data) };
}

async function main() {
  const startedAt = new Date();
  const apply = process.argv.includes("--apply");
  const now = Date.now();
  let itch: Map<string, SaleHit> | null = null;
  let itchError: string | null = null;
  let steamChecked = 0;
  let steamFailed = 0;

  const itchResult = await fetchItchSales(now);
  if (itchResult.ok) itch = itchResult.sales;
  else itchError = itchResult.error;

  const db = await getDb();
  const rows = await db
    .select({
      id: listings.id,
      source: listings.source,
      officialUrl: listings.officialUrl,
      externalId: listings.externalId,
      salePercent: listings.salePercent,
      saleEndsAt: listings.saleEndsAt,
    })
    .from(listings)
    .where(inArray(listings.source, [...SOURCES]));

  const steam = new Map<string, SaleHit | null>();
  const steamIds = [
    ...new Set(
      rows
        .filter((row) => row.source === "steam" && row.externalId?.trim())
        .map((row) => row.externalId!.trim()),
    ),
  ];
  for (const appId of steamIds) {
    const result = await fetchSteamSale(appId);
    await sleep(steamDelayMs());
    if (!result.ok) {
      steamFailed += 1;
      console.warn(`[sale-scan] steam ${appId}: ${result.error}`);
      continue;
    }
    steam.set(appId, result.sale);
    steamChecked += 1;
  }

  const saleRows: ListingSaleRow[] = rows.map((row) => ({
    id: row.id,
    source: row.source,
    officialUrl: row.officialUrl,
    externalId: row.externalId,
    salePercent: row.salePercent,
    saleEndsAt: row.saleEndsAt,
  }));
  const writes = planSaleWrites(saleRows, itch, steam);
  const changed = writes.filter((write) => write.changed);
  const marked = changed.filter((write) => write.salePercent != null).length;
  const cleared = changed.filter((write) => write.salePercent == null).length;

  if (apply) {
    const checkedAt = new Date();
    for (const write of writes) {
      await db
        .update(listings)
        .set({
          salePercent: write.salePercent,
          saleEndsAt: write.saleEndsAt,
          saleCheckedAt: checkedAt,
        })
        .where(eq(listings.id, write.id));
    }
  }

  const summary = {
    apply,
    itchOk: itch != null,
    itchError,
    itchSales: itch?.size ?? 0,
    itchPages: itchResult.ok ? itchResult.pages : 0,
    steamChecked,
    steamFailed,
    listings: rows.length,
    writes: writes.length,
    changed: changed.length,
    marked,
    cleared,
  };
  console.log(JSON.stringify(summary));

  await recordIngestRun({
    job: "sale_scan",
    status: "ok",
    startedAt,
    summary,
  });
}

main()
  .catch(async (err) => {
    console.error(err);
    await recordIngestRun({
      job: "sale_scan",
      status: "error",
      startedAt: new Date(),
      errorMessage: err instanceof Error ? err.message : String(err),
    }).catch(() => {});
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeCatalogDb().catch(() => {});
  });
