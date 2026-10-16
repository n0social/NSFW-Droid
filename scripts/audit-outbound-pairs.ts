/**
 * Find listings where affiliate_url points at a different store target than official_url.
 * Dry-run audit; use with catalog-maintenance on production PGlite.
 */
import "dotenv/config";
import { closeCatalogDb, getDb } from "../src/db";
import { listings } from "../src/db/schema";
import {
  outboundPairMismatch,
  type OutboundPairMismatch,
} from "../src/lib/outbound-link";

async function main() {
  const db = await getDb();
  const rows = await db.select().from(listings);
  const mismatches: OutboundPairMismatch[] = [];

  for (const row of rows) {
    const m = outboundPairMismatch(row);
    if (m) mismatches.push(m);
  }

  console.log(
    JSON.stringify(
      {
        total: rows.length,
        mismatchCount: mismatches.length,
        samples: mismatches.slice(0, 40),
      },
      null,
      2,
    ),
  );
  await closeCatalogDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
