import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  gscCachePath,
  gscWindowDays,
  getGscPropertyUrl,
  isGscSyncEnabled,
} from "@/lib/gsc-config";
import {
  gscDateRange,
  mapGscRows,
  querySearchAnalytics,
  type GscSearchRow,
} from "@/lib/gsc-api";

export type GscDailyRow = {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscQueryRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscSearchCacheFile = {
  version: 1;
  propertyUrl: string;
  windowDays: number;
  startDate: string;
  endDate: string;
  syncedAt: string;
  totals: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  daily: GscDailyRow[];
  topQueries: GscQueryRow[];
  syncError?: string;
};

function sumRows(rows: { clicks: number; impressions: number; position: number }[]): {
  clicks: number;
  impressions: number;
  position: number;
} {
  let clicks = 0;
  let impressions = 0;
  let positionWeighted = 0;
  for (const row of rows) {
    clicks += row.clicks;
    impressions += row.impressions;
    positionWeighted += row.position * row.impressions;
  }
  return { clicks, impressions, position: positionWeighted };
}

function buildCachePayload(
  windowDays: number,
  dailyRows: GscSearchRow[] | undefined,
  queryRows: GscSearchRow[] | undefined,
  syncError?: string,
): GscSearchCacheFile {
  const { startDate, endDate } = gscDateRange(windowDays);
  const daily = mapGscRows(dailyRows, "date")
    .map((r) => ({
      date: r.key,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topQueries = mapGscRows(queryRows, "query")
    .map((r) => ({
      query: r.key,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, 100);

  const totalsRaw = sumRows(daily);
  const ctr = totalsRaw.impressions > 0 ? totalsRaw.clicks / totalsRaw.impressions : 0;
  const position =
    totalsRaw.impressions > 0 ? totalsRaw.position / totalsRaw.impressions : 0;

  return {
    version: 1,
    propertyUrl: getGscPropertyUrl(),
    windowDays,
    startDate,
    endDate,
    syncedAt: new Date().toISOString(),
    totals: {
      clicks: totalsRaw.clicks,
      impressions: totalsRaw.impressions,
      ctr,
      position,
    },
    daily,
    topQueries,
    ...(syncError ? { syncError } : {}),
  };
}

export async function readGscSearchCache(): Promise<GscSearchCacheFile | null> {
  const filePath = gscCachePath();
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as GscSearchCacheFile;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeGscSearchCache(payload: GscSearchCacheFile): Promise<void> {
  const filePath = gscCachePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function syncGscSearchCache(windowDays = gscWindowDays()): Promise<GscSearchCacheFile> {
  if (!isGscSyncEnabled()) {
    throw new Error("GSC sync disabled — set GSC_SERVICE_ACCOUNT_JSON");
  }

  const { startDate, endDate } = gscDateRange(windowDays);

  try {
    const [dailyRes, queryRes] = await Promise.all([
      querySearchAnalytics({
        startDate,
        endDate,
        dimensions: ["date"],
      }),
      querySearchAnalytics({
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 500,
      }),
    ]);

    const payload = buildCachePayload(windowDays, dailyRes.rows, queryRes.rows);
    await writeGscSearchCache(payload);
    return payload;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const fallback = buildCachePayload(windowDays, undefined, undefined, message);
    await writeGscSearchCache(fallback).catch(() => {});
    throw err;
  }
}

/** Refresh when cache missing or older than ~20h (GSC daily lag). */
export function gscCacheIsStale(cache: GscSearchCacheFile | null, maxAgeHours = 20): boolean {
  if (!cache?.syncedAt) return true;
  const ageMs = Date.now() - new Date(cache.syncedAt).getTime();
  return ageMs > maxAgeHours * 60 * 60 * 1000;
}

export async function ensureGscSearchCache(options?: {
  refreshIfStale?: boolean;
}): Promise<GscSearchCacheFile | null> {
  const existing = await readGscSearchCache();
  if (!isGscSyncEnabled()) {
    return existing;
  }
  const shouldRefresh =
    options?.refreshIfStale !== false && (gscCacheIsStale(existing) || !existing);
  if (!shouldRefresh) {
    return existing;
  }
  try {
    return await syncGscSearchCache();
  } catch {
    return existing;
  }
}
