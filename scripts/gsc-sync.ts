#!/usr/bin/env -S npx tsx
/**
 * Pull Search Console Performance into data/.gsc-search-cache.json for admin UI.
 * Requires GSC_SERVICE_ACCOUNT_JSON (+ optional GSC_PROPERTY_URL) in env.
 */
import "dotenv/config";
import { syncGscSearchCache } from "../src/lib/gsc-cache";
import { getGscConfigStatus } from "../src/lib/gsc-config";

async function main() {
  const status = getGscConfigStatus();
  if (!status.configured) {
    console.error("[gsc-sync] Missing env:", status.missing.join(", "));
    process.exit(1);
  }

  const cache = await syncGscSearchCache();
  console.log(
    `[gsc-sync] OK ${cache.startDate}..${cache.endDate} clicks=${cache.totals.clicks} impressions=${cache.totals.impressions} queries=${cache.topQueries.length}`,
  );
}

main().catch((err) => {
  console.error("[gsc-sync]", err);
  process.exit(1);
});
