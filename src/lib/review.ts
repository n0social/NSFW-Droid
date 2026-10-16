import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { candidates, listings, type Candidate } from "@/db/schema";
import { copyCandidateTagsToListing } from "@/lib/catalog-tags";
import {
  artworkSourceForCover,
  extractCoverImageUrl,
} from "@/lib/listing-cover";
import { slugify } from "@/lib/slug";
import { resolveListingAffiliateUrl } from "@/lib/listing-affiliate";

export async function approveCandidate(
  candidateId: string,
  reviewer: string,
  opts?: {
    platforms?: string[];
    chartBucket?: string;
    chartRank?: number | null;
    affiliateUrl?: string | null;
  },
) {
  const db = await getDb();
  const [c] = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
  if (!c || c.reviewStatus !== "pending") return null;

  const [existingListing] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.source, c.source), eq(listings.externalId, c.externalId)))
    .limit(1);
  const raw = c.rawPayload as { platforms?: string[]; affiliate_url?: string } | null;
  const affiliateUrl =
    opts?.affiliateUrl !== undefined
      ? opts.affiliateUrl?.trim()
        ? opts.affiliateUrl.trim()
        : null
      : resolveListingAffiliateUrl(c.outboundUrl, {
          rawAffiliate: raw?.affiliate_url,
          existingAffiliate: existingListing?.affiliateUrl,
        });

  if (existingListing) {
    await copyCandidateTagsToListing(candidateId, existingListing.id);
    const listingPatch = {
      title: c.title,
      officialUrl: c.outboundUrl,
      affiliateUrl,
      updatedAt: new Date(),
    };
    if (
      listingPatch.title !== existingListing.title ||
      listingPatch.officialUrl !== existingListing.officialUrl ||
      listingPatch.affiliateUrl !== existingListing.affiliateUrl
    ) {
      await db
        .update(listings)
        .set(listingPatch)
        .where(eq(listings.id, existingListing.id));
      Object.assign(existingListing, listingPatch);
    }
    await db
      .update(candidates)
      .set({
        reviewStatus: "approved",
        reviewedAt: new Date(),
        reviewedBy: reviewer,
      })
      .where(eq(candidates.id, candidateId));
    return existingListing;
  }

  const slug = slugify(c.title, c.externalId);

  const coverImageUrl = extractCoverImageUrl(c.source, c.rawPayload);

  const [listing] = await db
    .insert(listings)
    .values({
      slug,
      title: c.title,
      platforms: opts?.platforms ?? raw?.platforms ?? defaultPlatforms(c.source),
      officialUrl: c.outboundUrl,
      affiliateUrl,
      artworkSource: artworkSourceForCover(coverImageUrl),
      coverImageUrl,
      source: c.source,
      externalId: c.externalId,
      firstSeenAt: c.firstSeenAt,
      chartBucket: opts?.chartBucket ?? (opts?.chartRank ? "top_grossing" : "new"),
      chartRank: opts?.chartRank ?? null,
    })
    .returning();

  await copyCandidateTagsToListing(candidateId, listing.id);

  await db
    .update(candidates)
    .set({
      reviewStatus: "approved",
      reviewedAt: new Date(),
      reviewedBy: reviewer,
    })
    .where(eq(candidates.id, candidateId));

  return listing;
}

export async function rejectCandidate(candidateId: string, reviewer: string, reason: string) {
  const db = await getDb();
  await db
    .update(candidates)
    .set({
      reviewStatus: "rejected",
      reviewedAt: new Date(),
      reviewedBy: reviewer,
      rejectReason: reason,
    })
    .where(eq(candidates.id, candidateId));
}

function defaultPlatforms(source: Candidate["source"]) {
  if (source === "steam") return ["windows"];
  if (source === "manual") return ["browser"];
  return ["browser"];
}

export async function createManualListing(input: {
  title: string;
  officialUrl: string;
  platforms: string[];
  reviewer: string;
}) {
  const db = await getDb();
  const externalId = `manual-${Date.now()}`;
  const slug = slugify(input.title, externalId);
  const [listing] = await db
    .insert(listings)
    .values({
      slug,
      title: input.title,
      platforms: input.platforms,
      officialUrl: input.officialUrl,
      artworkSource: "typographic",
      source: "manual",
      externalId,
      chartBucket: "new",
    })
    .returning();
  return listing;
}
