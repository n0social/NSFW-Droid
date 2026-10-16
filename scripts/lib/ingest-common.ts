import { and, eq } from "drizzle-orm";
import { getDb } from "../../src/db";
import { candidates, ingestSources, listings } from "../../src/db/schema";
import {
  autoPublishPendingCandidates,
  processCandidateAfterIngest,
} from "../../src/lib/auto-publish";
import {
  artworkSourceForCover,
  extractCoverImageUrl,
} from "../../src/lib/listing-cover";
import { syncTagsForCandidate } from "../../src/lib/catalog-tags";
import type { ExtractedTag } from "./tag-extract";
import { resolveListingAffiliateUrl } from "../../src/lib/listing-affiliate";

export const USER_AGENT =
  "NSFW-Droid-Catalog/0.1 (link catalog; +https://github.com/n0social/NSFW-Droid)";

export function slugify(title: string, suffix: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${suffix.slice(0, 8)}`;
}

export async function upsertCandidate(input: {
  source: "itch" | "steam" | "affiliate_export" | "developer_form";
  externalId: string;
  title: string;
  outboundUrl: string;
  rawPayload?: unknown;
  tags?: ExtractedTag[];
}): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .insert(candidates)
    .values({
      source: input.source,
      externalId: input.externalId,
      title: input.title,
      outboundUrl: input.outboundUrl,
      rawPayload: input.rawPayload ?? null,
    })
    .onConflictDoNothing()
    .returning({ id: candidates.id });

  let candidateId = result[0]?.id ?? null;
  const inserted = result.length > 0;

  if (!candidateId) {
    const [existing] = await db
      .select({ id: candidates.id })
      .from(candidates)
      .where(
        and(eq(candidates.source, input.source), eq(candidates.externalId, input.externalId)),
      )
      .limit(1);
    candidateId = existing?.id ?? null;
  }

  if (candidateId && input.tags?.length) {
    await syncTagsForCandidate(candidateId, input.tags);
  }

  if (!inserted && candidateId) {
    await touchListingOnIngestReseen(input.source, input.externalId, {
      title: input.title,
      outboundUrl: input.outboundUrl,
      rawPayload: input.rawPayload,
    });
  }

  if (inserted && candidateId) {
    await processCandidateAfterIngest(candidateId).catch(() => {});
  }

  return inserted;
}

/** Bump listing freshness when a feed item matches an existing candidate. */
async function touchListingOnIngestReseen(
  source: "itch" | "steam" | "affiliate_export" | "developer_form",
  externalId: string,
  patch: { title: string; outboundUrl: string; rawPayload?: unknown },
) {
  if (source !== "itch" && source !== "steam") return;

  const db = await getDb();
  const [listing] = await db
    .select()
    .from(listings)
    .where(
      and(eq(listings.source, source), eq(listings.externalId, externalId)),
    )
    .limit(1);
  if (!listing) return;

  const now = new Date();
  const wasStale = listing.catalogStale;
  const coverFromFeed =
    !listing.coverImageUrl?.trim() && patch.rawPayload
      ? extractCoverImageUrl(source, patch.rawPayload)
      : null;

  const rawAffiliate = (patch.rawPayload as { affiliate_url?: string } | null)?.affiliate_url;
  const affiliateUrl = resolveListingAffiliateUrl(patch.outboundUrl, {
    rawAffiliate,
    existingAffiliate: listing.affiliateUrl,
  });

  await db
    .update(listings)
    .set({
      title: patch.title,
      officialUrl: patch.outboundUrl,
      affiliateUrl,
      updatedAt: now,
      ...(coverFromFeed
        ? {
            coverImageUrl: coverFromFeed,
            artworkSource: artworkSourceForCover(coverFromFeed),
          }
        : {}),
      ...(wasStale
        ? {
            catalogStale: false,
            publishedAt: now,
            chartBucket: listing.chartBucket ?? "new",
          }
        : {}),
    })
    .where(eq(listings.id, listing.id));
}

export async function touchIngestSource(
  name: string,
  cursor: Record<string, unknown>,
  lastError: string | null = null,
) {
  const db = await getDb();
  await db
    .insert(ingestSources)
    .values({
      name,
      lastRunAt: new Date(),
      lastError,
      cursor,
    })
    .onConflictDoUpdate({
      target: ingestSources.name,
      set: {
        lastRunAt: new Date(),
        lastError,
        cursor,
      },
    });
}

/** @deprecated Use autoPublishPendingCandidates — kept for older scripts */
export async function autoPublishDemo(limit = 80) {
  const stats = await autoPublishPendingCandidates(limit);
  return stats.published;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
