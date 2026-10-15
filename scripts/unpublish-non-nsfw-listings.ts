/**
 * Remove public listings (and reject their candidates) that fail mature-catalog checks.
 * Dry-run by default — pass --apply to delete rows.
 */
import "dotenv/config";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../src/db";
import { candidates, listingTags, listings, tags } from "../src/db/schema";
import {
  isCatalogNsfwEnforcementEnabled,
  isMatureCatalogCandidate,
} from "../src/lib/catalog-maturity";
import { rejectCandidate } from "../src/lib/review";

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
  const apply = process.argv.includes("--apply");
  if (!isCatalogNsfwEnforcementEnabled()) {
    console.log(
      JSON.stringify({
        skipped: true,
        reason: "CATALOG_NSFW_ONLY=0 — set to 1 or unset to enforce",
      }),
    );
    return;
  }

  const db = await getDb();
  const all = await db.select().from(listings);
  const tagMap = await tagSlugsByListingId(all.map((l) => l.id));

  const candidateKeys = all
    .filter((l) => l.source && l.externalId)
    .map((l) => ({ source: l.source!, externalId: l.externalId! }));
  const candidateByKey = new Map<string, typeof candidates.$inferSelect>();
  if (candidateKeys.length) {
    const candidateRows = await db.select().from(candidates);
    for (const c of candidateRows) {
      candidateByKey.set(`${c.source}:${c.externalId}`, c);
    }
  }

  const toRemove: { id: string; title: string; source: string | null }[] = [];

  for (const listing of all) {
    const tagSlugs = tagMap.get(listing.id) ?? [];
    const candidate =
      listing.source && listing.externalId
        ? candidateByKey.get(`${listing.source}:${listing.externalId}`)
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

    if (!mature) {
      toRemove.push({
        id: listing.id,
        title: listing.title,
        source: listing.source,
      });
    }
  }

  const [before] = await db.select({ n: sql<number>`count(*)::int` }).from(listings);

  if (apply && toRemove.length) {
    const removeIds = toRemove.map((r) => r.id);
    for (const listing of all) {
      if (!removeIds.includes(listing.id)) continue;
      const candidate =
        listing.source && listing.externalId
          ? candidateByKey.get(`${listing.source}:${listing.externalId}`)
          : undefined;
      if (candidate && candidate.reviewStatus === "approved") {
        await rejectCandidate(candidate.id, "catalog_maturity_cleanup", "not_mature_catalog");
      }
    }
    await db.delete(listings).where(inArray(listings.id, removeIds));
  }

  const [after] = await db.select({ n: sql<number>`count(*)::int` }).from(listings);

  console.log(
    JSON.stringify(
      {
        apply,
        listingCountBefore: before?.n ?? 0,
        listingCountAfter: after?.n ?? 0,
        removed: apply ? toRemove.length : 0,
        wouldRemove: toRemove.length,
        sample: toRemove.slice(0, 25),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
