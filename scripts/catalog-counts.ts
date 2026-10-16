import "dotenv/config";
import { sql } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";

async function main() {
  const db = await getDb();
  const totals = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM listing) AS listings,
      (SELECT count(*)::int FROM listing WHERE catalog_stale = false AND link_status = 'ok') AS live,
      (SELECT count(*)::int FROM candidate) AS candidates,
      (SELECT count(*)::int FROM candidate WHERE review_status = 'pending') AS pending
  `);
  const bySource = await db.execute(sql`
    SELECT coalesce(source::text, 'unknown') AS source, count(*)::int AS count
    FROM listing
    GROUP BY source
    ORDER BY count DESC
  `);
  console.log(JSON.stringify({ totals: totals.rows[0], bySource: bySource.rows }, null, 2));
  await closeCatalogDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
