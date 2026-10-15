/**
 * Remove public listings (and reject their candidates) that fail mature-catalog checks.
 * Dry-run by default — pass --apply to delete rows.
 */
import "dotenv/config";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../src/db";
import { candidates, listingTags, listings, tags } from "../src/db/schema";
import {
  isCatalogNsfwEnforcementEnabled,
  isMatureCatalogCandidate,
} from "../src/lib/catalog-maturity";
import { rejectCandidate } from "../src/lib/review";

async function tagSlugsForListing(listingId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ slug: tags.slug })
    .from(listingTags)
    .innerJoin(tags, eq(listingTags.tagId, tags.id))
    .where(eq(listingTags.listingId, listingId));
  return rows.map((r) => r.slug);
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
  const toRemove: { id: string; title: string; source: string | null }[] = [];

  for (const listing of all) {
    const tagSlugs = await tagSlugsForListing(listing.id);
    let candidate = null;
    if (listing.source && listing.externalId) {
      const [c] = await db
        .select()
        .from(candidates)
        .where(
          and(
            eq(candidates.source, listing.source),
            eq(candidates.externalId, listing.externalId),
          ),
        )
        .limit(1);
      candidate = c ?? null;
    }

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

  if (apply) {
    for (const row of toRemove) {
      const listing = all.find((l) => l.id === row.id);
      if (listing?.source && listing.externalId) {
        const [c] = await db
          .select()
          .from(candidates)
          .where(
            and(
              eq(candidates.source, listing.source),
              eq(candidates.externalId, listing.externalId),
            ),
          )
          .limit(1);
        if (c && c.reviewStatus === "approved") {
          await rejectCandidate(c.id, "catalog_maturity_cleanup", "not_mature_catalog");
        }
      }
      await db.delete(listings).where(eq(listings.id, row.id));
    }
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
