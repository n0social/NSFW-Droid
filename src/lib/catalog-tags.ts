import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  candidateTags,
  candidates,
  listingTags,
  listings,
  tags,
} from "@/db/schema";

export type CatalogTagInput = { slug: string; label: string; kind: string };

export async function ensureTags(extracted: CatalogTagInput[]): Promise<string[]> {
  const ids: string[] = [];
  for (const t of extracted) {
    const [row] = await db
      .insert(tags)
      .values({ slug: t.slug, label: t.label, kind: t.kind })
      .onConflictDoUpdate({
        target: tags.slug,
        set: { label: t.label, kind: t.kind },
      })
      .returning({ id: tags.id });
    if (row) ids.push(row.id);
  }
  return ids;
}

export async function linkCandidateTags(candidateId: string, tagIds: string[]) {
  for (const tagId of tagIds) {
    await db
      .insert(candidateTags)
      .values({ candidateId, tagId })
      .onConflictDoNothing();
  }
}

export async function copyCandidateTagsToListing(
  candidateId: string,
  listingId: string,
) {
  const rows = await db
    .select({ tagId: candidateTags.tagId })
    .from(candidateTags)
    .where(eq(candidateTags.candidateId, candidateId));
  for (const { tagId } of rows) {
    await db
      .insert(listingTags)
      .values({ listingId, tagId })
      .onConflictDoNothing();
  }
}

export async function syncTagsForCandidate(
  candidateId: string,
  extracted: CatalogTagInput[],
) {
  if (!extracted.length) return;
  const tagIds = await ensureTags(extracted);
  await linkCandidateTags(candidateId, tagIds);
}

export async function backfillCandidateTags(
  derive: (c: typeof candidates.$inferSelect) => CatalogTagInput[],
  limit = 5000,
) {
  const rows = await db.select().from(candidates).limit(limit);
  let updated = 0;
  for (const c of rows) {
    const extracted = derive(c);
    if (!extracted.length) continue;
    await syncTagsForCandidate(c.id, extracted);
    updated += 1;
  }
  return updated;
}

export async function backfillListingTagsFromCandidates() {
  const approved = await db
    .select()
    .from(candidates)
    .where(eq(candidates.reviewStatus, "approved"));
  let linked = 0;
  for (const c of approved) {
    const [listing] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.externalId, c.externalId))
      .limit(1);
    if (!listing) continue;
    await copyCandidateTagsToListing(c.id, listing.id);
    linked += 1;
  }
  return linked;
}
