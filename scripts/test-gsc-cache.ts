import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  gscCacheIsStale,
  readGscSearchCache,
  writeGscSearchCache,
  type GscSearchCacheFile,
} from "../src/lib/gsc-cache";

const sample: GscSearchCacheFile = {
  version: 1,
  propertyUrl: "https://www.nsfwdroid.com/",
  windowDays: 28,
  startDate: "2026-01-01",
  endDate: "2026-01-28",
  syncedAt: new Date().toISOString(),
  totals: { clicks: 10, impressions: 100, ctr: 0.1, position: 12.3 },
  daily: [
    {
      date: "2026-01-27",
      clicks: 5,
      impressions: 50,
      ctr: 0.1,
      position: 11,
    },
  ],
  topQueries: [
    {
      query: "nsfw droid",
      clicks: 3,
      impressions: 20,
      ctr: 0.15,
      position: 8.5,
    },
  ],
};

async function main() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "gsc-cache-"));
  const file = path.join(dir, "cache.json");
  process.env.GSC_CACHE_PATH = file;

  await writeGscSearchCache(sample);
  const raw = await readFile(file, "utf8");
  assert(raw.includes('"version": 1'), "writes JSON");

  const loaded = await readGscSearchCache();
  assert(loaded?.totals.clicks === 10, "reads cache");
  assert(!gscCacheIsStale(loaded!, 20), "fresh cache not stale");

  const old: GscSearchCacheFile = {
    ...sample,
    syncedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  };
  assert(gscCacheIsStale(old, 20), "old cache is stale");

  await rm(dir, { recursive: true, force: true });
  delete process.env.GSC_CACHE_PATH;
  console.log("test-gsc-cache: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
