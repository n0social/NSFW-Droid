import { sql } from "drizzle-orm";
import { getDb } from "@/db";
export const DEFAULT_NEW_ARRIVALS_REPORT_DAYS = 7;

export type NewArrivalListingRow = {
  id: string;
  slug: string;
  title: string;
  source: string | null;
  externalId: string | null;
  firstSeenAt: string;
  publishedAt: string;
  publishedBumped: boolean;
};

export type NewArrivalsTotals = {
  addedLiveByFirstSeen: number;
  addedLiveByPublishedAt: number;
};

/** Live catalog rows whose first-seen (or published) falls within the window. */
export async function countListingsAddedInDays(days: number): Promise<NewArrivalsTotals> {
  const db = await getDb();
  const window = sql`(${days}::text || ' days')::interval`;
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM listing
        WHERE catalog_stale = false AND link_status = 'ok'
          AND coalesce(first_seen_at, published_at) >= now() - ${window}) AS added_live_by_first_seen,
      (SELECT count(*)::int FROM listing
        WHERE catalog_stale = false AND link_status = 'ok'
          AND published_at >= now() - ${window}) AS added_live_by_published_at
  `);
  const row = result.rows[0] as Record<string, number>;
  return {
    addedLiveByFirstSeen: row.added_live_by_first_seen ?? 0,
    addedLiveByPublishedAt: row.added_live_by_published_at ?? 0,
  };
}

export async function listListingsAddedInDays(
  days: number,
  limit = 100,
): Promise<NewArrivalListingRow[]> {
  const db = await getDb();
  const window = sql`(${days}::text || ' days')::interval`;
  const result = await db.execute(sql`
    SELECT l.id, l.slug, l.title, l.source::text AS source, l.external_id,
      l.first_seen_at, l.published_at,
      (l.published_at > coalesce(l.first_seen_at, l.published_at) + interval '2 days') AS published_bumped
    FROM listing l
    WHERE l.catalog_stale = false AND l.link_status = 'ok'
      AND coalesce(l.first_seen_at, l.published_at) >= now() - ${window}
    ORDER BY coalesce(l.first_seen_at, l.published_at) DESC
    LIMIT ${limit}
  `);

  return (result.rows as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    source: r.source != null ? String(r.source) : null,
    externalId: r.external_id != null ? String(r.external_id) : null,
    firstSeenAt: new Date(String(r.first_seen_at)).toISOString(),
    publishedAt: new Date(String(r.published_at)).toISOString(),
    publishedBumped: Boolean(r.published_bumped),
  }));
}
