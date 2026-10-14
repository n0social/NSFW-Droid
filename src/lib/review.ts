import { eq } from "drizzle-orm";
import { db } from "@/db";
import { candidates, listings, type Candidate } from "@/db/schema";
import { slugify } from "@/lib/slug";

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
  const [c] = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
  if (!c || c.reviewStatus !== "pending") return null;

  const slug = slugify(c.title, c.externalId);
  const raw = c.rawPayload as { platforms?: string[]; affiliate_url?: string } | null;
  const affiliateUrl =
    opts?.affiliateUrl !== undefined
      ? opts.affiliateUrl
      : raw?.affiliate_url?.trim()
        ? raw.affiliate_url.trim()
        : null;

  const [listing] = await db
    .insert(listings)
    .values({
      slug,
      title: c.title,
      platforms: opts?.platforms ?? raw?.platforms ?? defaultPlatforms(c.source),
      officialUrl: c.outboundUrl,
      affiliateUrl,
      artworkSource: "typographic",
      source: c.source,
      externalId: c.externalId,
      chartBucket: opts?.chartBucket ?? (opts?.chartRank ? "top_grossing" : "new"),
      chartRank: opts?.chartRank ?? null,
    })
    .returning();

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
