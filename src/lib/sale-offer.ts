import { XMLParser } from "fast-xml-parser";

export type SaleHit = {
  percent: number;
  /** Null when the store did not publish an end (Steam price overview). */
  endsAt: Date | null;
};

export type ListingSaleRow = {
  id: string;
  source: string | null;
  officialUrl: string;
  externalId: string | null;
  salePercent: number | null;
  saleEndsAt: Date | null;
};

export type SaleWrite = {
  id: string;
  salePercent: number | null;
  saleEndsAt: Date | null;
  /** True when the discount or end changed, not only the check timestamp. */
  changed: boolean;
};

const parser = new XMLParser({ ignoreAttributes: false });

export function normalizeStoreUrl(raw: string | null | undefined): string | null {
  const text = raw?.trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    return `${host}${path}`;
  } catch {
    return null;
  }
}

export function saleIsCurrent(sale: SaleHit, now = Date.now()): boolean {
  if (!Number.isInteger(sale.percent) || sale.percent <= 0 || sale.percent > 100) return false;
  if (sale.endsAt && sale.endsAt.getTime() <= now) return false;
  return true;
}

function asPercent(value: unknown): number | null {
  const percent = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isFinite(percent)) return null;
  const rounded = Math.round(percent);
  if (rounded <= 0 || rounded > 100) return null;
  return rounded;
}

function asEnds(value: unknown): Date | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const ends = new Date(text);
  return Number.isNaN(ends.getTime()) ? null : ends;
}

function itchItemKey(item: Record<string, unknown>): string | null {
  const guid = item.guid;
  const guidText =
    guid && typeof guid === "object"
      ? String((guid as { "#text"?: unknown })["#text"] ?? "")
      : String(guid ?? "");
  return normalizeStoreUrl(guidText) ?? normalizeStoreUrl(String(item.link ?? ""));
}

export function itchSaleFromItem(item: Record<string, unknown>, now = Date.now()): { key: string; sale: SaleHit } | null {
  const key = itchItemKey(item);
  const percent = asPercent(item.discountpercent ?? item.discountPercent);
  if (!key || percent == null) return null;
  const sale = { percent, endsAt: asEnds(item.saleends ?? item.saleEnds) };
  if (!saleIsCurrent(sale, now)) return null;
  return { key, sale };
}

export function parseItchSaleFeed(xml: string, now = Date.now()): { itemCount: number; sales: Map<string, SaleHit> } {
  const doc = parser.parse(xml);
  const items = doc?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];
  const sales = new Map<string, SaleHit>();
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const hit = itchSaleFromItem(item as Record<string, unknown>, now);
    if (hit) sales.set(hit.key, hit.sale);
  }
  return { itemCount: list.length, sales };
}

export function steamSaleFromDetails(data: unknown): SaleHit | null {
  if (!data || typeof data !== "object") return null;
  const overview = (data as { price_overview?: { discount_percent?: unknown } }).price_overview;
  const percent = asPercent(overview?.discount_percent);
  if (percent == null) return null;
  return { percent, endsAt: null };
}

function sameEnds(a: Date | null, b: Date | null): boolean {
  if (a == null || b == null) return a == null && b == null;
  return a.getTime() === b.getTime();
}

function itchHit(row: ListingSaleRow, itch: Map<string, SaleHit>): SaleHit | null {
  for (const raw of [row.officialUrl, row.externalId]) {
    const key = normalizeStoreUrl(raw);
    if (!key) continue;
    const hit = itch.get(key);
    if (hit) return hit;
  }
  return null;
}

/**
 * Rows to write after a scan.
 * A source that failed is left untouched.
 * Steam map values are null when that app was checked and is not discounted.
 * Missing Steam ids were not checked.
 */
export function planSaleWrites(
  rows: ListingSaleRow[],
  itch: Map<string, SaleHit> | null,
  steam: Map<string, SaleHit | null>,
): SaleWrite[] {
  const writes: SaleWrite[] = [];
  for (const row of rows) {
    let next: SaleHit | null | undefined;
    if (row.source === "itch") {
      if (!itch) continue;
      next = itchHit(row, itch);
    } else if (row.source === "steam") {
      const appId = row.externalId?.trim();
      if (!appId || !steam.has(appId)) continue;
      next = steam.get(appId) ?? null;
    } else {
      continue;
    }
    const salePercent = next?.percent ?? null;
    const saleEndsAt = next?.endsAt ?? null;
    const changed = row.salePercent !== salePercent || !sameEnds(row.saleEndsAt, saleEndsAt);
    writes.push({ id: row.id, salePercent, saleEndsAt, changed });
  }
  return writes;
}
