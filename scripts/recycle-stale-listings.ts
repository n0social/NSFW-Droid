/**
 * Deprioritize feed-backed listings not refreshed by ingest within N days.
 * Dry-run by default — pass --apply to update rows.
 *
 * Env: CATALOG_STALE_DAYS (default 14)
 */
import "dotenv/config";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";
import { candidates, listingTags, listings, tags } from "../src/db/schema";
import { recordIngestRun } from "../src/lib/ingest-run";
import {
  isCatalogNsfwEnforcementEnabled,
  isMatureCatalogCandidate,
} from "../src/lib/catalog-maturity";

const FEED_SOURCES = ["itch", "steam"] as const;

function staleDays(): number {
  const n = Number(process.env.CATALOG_STALE_DAYS ?? "14");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 14;
}

async function tagSlugsByListingId(
  listingIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!listingIds.length) return map;
  const db = await getDb();
  const rows = await db
    .select({ listingId: listingTags.listingId, slug: tags.slug })
    .from(listingTags)
    .innerJoin(tags, eq(listingTags.tagId, tags.id))
    .where(inArray(listingTags.listingId, listingIds));
  for (const row of rows) {
    const list = map.get(row.listingId) ?? [];
    list.push(row.slug);
    map.set(row.listingId, list);
  }
  return map;
}

async function main() {
  const startedAt = new Date();
  const apply = process.argv.includes("--apply");
  const days = staleDays();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const db = await getDb();

  const candidatesByKey = new Map<string, typeof candidates.$inferSelect>();
  for (const c of await db.select().from(candidates)) {
    candidatesByKey.set(`${c.source}:${c.externalId}`, c);
  }

  const rows = await db
    .select()
    .from(listings)
    .where(
      and(
        inArray(listings.source, [...FEED_SOURCES]),
        eq(listings.linkStatus, "ok"),
        eq(listings.catalogStale, false),
        lt(listings.updatedAt, cutoff),
      ),
    );

  const tagMap = await tagSlugsByListingId(rows.map((l) => l.id));
  const nsfwOnly = isCatalogNsfwEnforcementEnabled();

  const toStale: { id: string; title: string; source: string | null; updatedAt: Date }[] =
    [];
  let skippedNonMature = 0;

  for (const listing of rows) {
    const tagSlugs = tagMap.get(listing.id) ?? [];
    const candidate =
      listing.source && listing.externalId
        ? candidatesByKey.get(`${listing.source}:${listing.externalId}`)
        : undefined;

    const mature = candidate
      ? isMatureCatalogCandidate(candidate, tagSlugs)
      : isMatureCatalogCandidate(
          {
            source: listing.source ?? "itch",
            title: listing.title,
            rawPayload: null,
          },
          tagSlugs,
        );

    if (nsfwOnly && !mature) {
      skippedNonMature += 1;
      continue;
    }

    toStale.push({
      id: listing.id,
      title: listing.title,
      source: listing.source,
      updatedAt: listing.updatedAt,
    });
  }

  if (apply && toStale.length) {
    const ids = toStale.map((r) => r.id);
    await db
      .update(listings)
      .set({
        catalogStale: true,
        chartRank: null,
        chartBucket: null,
        updatedAt: new Date(),
      })
      .where(inArray(listings.id, ids));
  }

  const counts = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM listing WHERE catalog_stale = true) AS stale_listings,
      (SELECT count(*)::int FROM listing WHERE link_status = 'ok') AS ok_listings
  `);

  const summary = {
    apply,
    staleDays: days,
    cutoff: cutoff.toISOString(),
    candidates: rows.length,
    wouldStale: toStale.length,
    staled: apply ? toStale.length : 0,
    skippedNonMature,
    catalog: counts.rows[0],
    sample: toStale.slice(0, 20),
  };

  console.log(JSON.stringify(summary, null, 2));

  await recordIngestRun({
    job: "recycle_stale",
    status: "ok",
    startedAt,
    summary: summary as Record<string, unknown>,
  });

  await closeCatalogDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
