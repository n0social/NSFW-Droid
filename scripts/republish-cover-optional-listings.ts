/**
 * Re-create public listings for entries in data/cover-optional-listings.json
 * when the candidate exists but no listing row (e.g. after unpublish-incomplete).
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";
import { candidates, listings } from "../src/db/schema";
import {
  candidateMatchesCoverOptionalOverride,
  getCoverOptionalListingsSync,
} from "../src/lib/cover-optional-listings";
import { approveCandidate } from "../src/lib/review";

async function main() {
  const db = await getDb();
  const entries = getCoverOptionalListingsSync();
  const allCandidates = await db.select().from(candidates);
  const restored: { title: string; slug: string | null; candidateId: string }[] = [];
  const skipped: { title: string; reason: string }[] = [];

  for (const entry of entries) {
    const matched = allCandidates.filter((c) =>
      candidateMatchesCoverOptionalOverride(c, [entry]),
    );
    if (!matched.length) {
      skipped.push({
        title: entry.slug ?? entry.officialUrl ?? "unknown",
        reason: "no_matching_candidate",
      });
      continue;
    }

    for (const c of matched) {
      if (c.source !== "itch" && c.source !== "steam") {
        skipped.push({ title: c.title, reason: `source_${c.source}` });
        continue;
      }

      const [existing] = await db
        .select({ id: listings.id, slug: listings.slug })
        .from(listings)
        .where(
          and(eq(listings.source, c.source), eq(listings.externalId, c.externalId)),
        )
        .limit(1);
      if (existing) {
        skipped.push({ title: c.title, reason: `already_listed:${existing.slug}` });
        continue;
      }

      if (c.reviewStatus !== "pending") {
        await db
          .update(candidates)
          .set({
            reviewStatus: "pending",
            rejectReason: null,
            reviewedAt: null,
            reviewedBy: null,
          })
          .where(eq(candidates.id, c.id));
      }

      const listing = await approveCandidate(c.id, "cover_optional_restore");
      if (!listing) {
        skipped.push({ title: c.title, reason: "approve_failed" });
        continue;
      }
      restored.push({ title: c.title, slug: listing.slug, candidateId: c.id });
    }
  }

  console.log(JSON.stringify({ restored, skipped, entryCount: entries.length }, null, 2));
  await closeCatalogDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
