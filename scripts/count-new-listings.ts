import "dotenv/config";
import { sql } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";

async function main() {
  const db = await getDb();
  const days = Number(process.env.NEW_LISTING_MAX_AGE_DAYS?.trim() || 30);
  const result = await db.execute(sql`
    SELECT
      count(*) FILTER (
        WHERE catalog_stale = false AND link_status = 'ok'
          AND coalesce(first_seen_at, published_at) >= now() - (${days}::text || ' days')::interval
      )::int AS new_by_first_seen,
      count(*) FILTER (
        WHERE catalog_stale = false AND link_status = 'ok'
          AND published_at >= now() - (${days}::text || ' days')::interval
      )::int AS new_by_published_at,
      count(*) FILTER (
        WHERE published_at > coalesce(first_seen_at, published_at) + interval '2 days'
      )::int AS published_bumped_vs_first_seen
  `);
  const row = result.rows[0] as Record<string, number>;
  console.log(
    JSON.stringify(
      {
        maxAgeDays: days,
        newByFirstSeen: row?.new_by_first_seen ?? 0,
        newByPublishedAt: row?.new_by_published_at ?? 0,
        publishedBumpedVsFirstSeen: row?.published_bumped_vs_first_seen ?? 0,
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
