/**
 * Growth report: listings truly added vs recycle-bumped "new" signals.
 * Usage: npm run db:migrate && npx tsx scripts/catalog-new-arrivals-report.ts
 * Prod: point DATABASE_URL (or run on droplet with /etc/nsfwdroid.env sourced).
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import {
  countListingsAddedInDays,
  listListingsAddedInDays,
} from "../src/lib/catalog-new-arrivals-report";
import { closeCatalogDb, getDb } from "../src/db";

async function main() {
  const days = Number(process.argv[2] ?? process.env.REPORT_DAYS ?? "7");
  const db = await getDb();
  const window = sql`(${days}::text || ' days')::interval`;

  const totalsExtra = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM listing) AS listings_total,
      (SELECT count(*)::int FROM listing WHERE catalog_stale = false AND link_status = 'ok') AS listings_live,
      (SELECT count(*)::int FROM candidate WHERE first_seen_at >= now() - ${window}) AS candidates_first_seen,
      (SELECT count(*)::int FROM candidate
        WHERE first_seen_at >= now() - ${window} AND review_status = 'pending') AS candidates_pending_first_seen
  `);

  const added = await countListingsAddedInDays(days);

  const byDay = await db.execute(sql`
    SELECT date_trunc('day', coalesce(l.first_seen_at, l.published_at))::date AS day,
      count(*)::int AS listings
    FROM listing l
    WHERE l.catalog_stale = false AND l.link_status = 'ok'
      AND coalesce(l.first_seen_at, l.published_at) >= now() - ${window}
    GROUP BY 1
    ORDER BY 1 DESC
  `);

  const recent = await listListingsAddedInDays(days, 20);

  const ingest = await db.execute(sql`
    SELECT started_at, summary->'newCandidatesInserted' AS new_inserted,
      summary->'catalog'->>'listings' AS listings_after
    FROM ingest_run
    WHERE job = 'ingest_all'
    ORDER BY started_at DESC
    LIMIT 8
  `);

  const extra = totalsExtra.rows[0] as Record<string, number>;
  console.log(
    JSON.stringify(
      {
        reportDays: days,
        totals: {
          ...extra,
          added_live_by_first_seen: added.addedLiveByFirstSeen,
          added_live_by_published_at: added.addedLiveByPublishedAt,
        },
        byFirstSeenDay: byDay.rows,
        recentByFirstSeen: recent,
        recentIngestRuns: ingest.rows,
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
