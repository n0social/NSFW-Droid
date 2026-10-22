/**
 * Remove public listings that lack an allowlisted store cover URL.
 * Dry-run by default — pass --apply to delete rows and reject linked candidates.
 */
import "dotenv/config";
import { inArray, isNull, or, sql } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";
import { candidates, listings } from "../src/db/schema";
import { listingHasPublishableCover } from "../src/lib/listing-publish-profile";
import { rejectCandidate } from "../src/lib/review";

function incompleteListingCondition() {
  return or(isNull(listings.coverImageUrl), sql`trim(${listings.coverImageUrl}) = ''`);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const db = await getDb();

  const incomplete = await db
    .select()
    .from(listings)
    .where(incompleteListingCondition());

  const candidateByKey = new Map<string, typeof candidates.$inferSelect>();
  const candidateRows = await db.select().from(candidates);
  for (const c of candidateRows) {
    candidateByKey.set(`${c.source}:${c.externalId}`, c);
  }

  const toRemove = incomplete.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    source: l.source,
    hasCover: listingHasPublishableCover(l),
  }));

  if (apply && toRemove.length) {
    const removeIds = toRemove.map((r) => r.id);
    for (const listing of incomplete) {
      const candidate =
        listing.source && listing.externalId
          ? candidateByKey.get(`${listing.source}:${listing.externalId}`)
          : undefined;
      if (candidate && candidate.reviewStatus === "approved") {
        await rejectCandidate(
          candidate.id,
          "catalog_profile_cleanup",
          "missing_store_cover",
        );
      }
    }
    await db.delete(listings).where(inArray(listings.id, removeIds));
  }

  console.log(
    JSON.stringify(
      {
        apply,
        wouldRemove: toRemove.length,
        removed: apply ? toRemove.length : 0,
        sample: toRemove.slice(0, 40),
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
