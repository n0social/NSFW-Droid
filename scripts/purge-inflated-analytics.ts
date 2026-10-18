/**
 * Remove historical analytics rows that do not match visitor play-click / impression rules.
 * Dry-run by default — pass --apply to DELETE matching rows.
 *
 * Production (PGlite on droplet, app stopped):
 *   sudo /var/www/nsfwdroid/scripts/catalog-maintenance.sh -- \
 *     npx --yes tsx scripts/purge-inflated-analytics.ts
 *   sudo /var/www/nsfwdroid/scripts/catalog-maintenance.sh -- \
 *     npx --yes tsx scripts/purge-inflated-analytics.ts --apply
 *
 * Back up data/catalog before --apply (tar czf catalog-backup.tgz data/catalog).
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";
import { inflatedAnalyticsEventSql } from "../src/lib/analytics-purge";
import {
  ADMIN_REFERRER_RE,
  storedLikelyBotUserAgentSql,
  uniqueBrowserSessionSql,
  VISITOR_REFERRER_RE,
  visitorQualityListingViewSql,
  visitorQualityOutboundClickSql,
} from "../src/lib/analytics-quality";

async function main() {
  const apply = process.argv.includes("--apply");
  const db = await getDb();
  const inflated = inflatedAnalyticsEventSql();

  const totals = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM analytics_event) AS total,
      (SELECT count(*)::int FROM analytics_event WHERE ${inflated}) AS inflated
  `);
  const totalRow = totals.rows[0] as { total: number; inflated: number };
  const total = Number(totalRow.total);
  const inflatedCount = Number(totalRow.inflated);

  const breakdown = await db.execute(sql`
    SELECT event_type, count(*)::int AS count
    FROM analytics_event
    WHERE ${inflated}
    GROUP BY event_type
    ORDER BY event_type
  `);

  const reasons = await db.execute(sql`
    SELECT reason, count(*)::int AS count FROM (
      SELECT
        CASE
          WHEN ${storedLikelyBotUserAgentSql()} THEN 'stored_bot_user_agent'
          WHEN event_type = 'outbound_click' AND referrer IS NULL THEN 'outbound_no_referrer'
          WHEN event_type = 'outbound_click' AND referrer IS NOT NULL AND NOT (referrer ~ ${VISITOR_REFERRER_RE}) THEN 'outbound_bad_referrer'
          WHEN event_type = 'outbound_click' AND referrer ~ ${ADMIN_REFERRER_RE} THEN 'outbound_admin_referrer'
          WHEN event_type = 'outbound_click' AND NOT (${uniqueBrowserSessionSql()}) THEN 'outbound_shared_session'
          WHEN event_type = 'listing_view' AND NOT (${uniqueBrowserSessionSql()}) THEN 'listing_view_shared_session'
          WHEN event_type = 'page_view' AND NOT (${uniqueBrowserSessionSql()}) THEN 'page_view_shared_session'
          WHEN coalesce(metadata->>'internal', '') IN ('true', '1') THEN 'tagged_internal'
          WHEN coalesce(metadata->>'adminSession', '') IN ('true', '1') THEN 'tagged_admin_session'
          ELSE 'other_inflated'
        END AS reason
      FROM analytics_event
      WHERE ${inflated}
    ) sub
    GROUP BY reason
    ORDER BY count DESC
  `);

  const keepQuality = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM analytics_event WHERE ${visitorQualityOutboundClickSql()}) AS quality_outbound,
      (SELECT count(*)::int FROM analytics_event WHERE ${visitorQualityListingViewSql()}) AS quality_listing_views
  `);
  const quality = keepQuality.rows[0] as {
    quality_outbound: number;
    quality_listing_views: number;
  };

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        totalRows: total,
        inflatedRows: inflatedCount,
        rowsAfterPurge: total - inflatedCount,
        qualityOutboundRemaining: Number(quality.quality_outbound),
        qualityListingViewsRemaining: Number(quality.quality_listing_views),
        inflatedByEventType: breakdown.rows,
        inflatedByReason: reasons.rows,
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log("Dry-run only. Re-run with --apply to delete inflated rows.");
    await closeCatalogDb();
    return;
  }

  if (inflatedCount === 0) {
    console.log("Nothing to delete.");
    await closeCatalogDb();
    return;
  }

  const deleted = await db.execute(sql`
    DELETE FROM analytics_event WHERE ${inflated} RETURNING id
  `);
  const after = await db.execute(sql`SELECT count(*)::int AS total FROM analytics_event`);
  const afterTotal = Number((after.rows[0] as { total: number }).total);

  console.log(
    JSON.stringify(
      {
        deletedRows: deleted.rows.length,
        totalRowsAfter: afterTotal,
      },
      null,
      2,
    ),
  );
  await closeCatalogDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
