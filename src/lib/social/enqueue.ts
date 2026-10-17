import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { listings, socialOutbox } from "@/db/schema";
import {
  assessNewsletterPickEligibility,
  loadNewsletterPickEligibilityContext,
} from "@/lib/newsletter/pick-eligibility";
import { buildSocialPostPayload } from "@/lib/social/compose";
import {
  activeSocialPlatforms,
  socialEnqueueWindowHours,
  socialMaxPerIngest,
  type SocialPlatform,
} from "@/lib/social/config";

export type SocialEnqueueResult = {
  scanned: number;
  enqueued: number;
  skippedIneligible: number;
  skippedExisting: number;
  byPlatform: Record<SocialPlatform, number>;
};

export async function enqueueSocialForNewListings(
  db: CatalogDb,
  options?: { maxPerPlatform?: number; platforms?: SocialPlatform[] },
): Promise<SocialEnqueueResult> {
  const platforms = options?.platforms ?? activeSocialPlatforms();
  const maxPerPlatform = options?.maxPerPlatform ?? socialMaxPerIngest();
  const since = new Date(Date.now() - socialEnqueueWindowHours() * 60 * 60 * 1000);

  const result: SocialEnqueueResult = {
    scanned: 0,
    enqueued: 0,
    skippedIneligible: 0,
    skippedExisting: 0,
    byPlatform: { mastodon: 0, pillowfort: 0 },
  };

  if (!platforms.length) return result;

  const existingRows = await db
    .select({ listingId: socialOutbox.listingId, platform: socialOutbox.platform })
    .from(socialOutbox)
    .where(
      or(
        ...platforms.map((p) => eq(socialOutbox.platform, p)),
      ),
    );

  const existingKeys = new Set(
    existingRows.map((r) => `${r.listingId}:${r.platform}`),
  );

  const candidateListings = await db
    .select({
      id: listings.id,
      title: listings.title,
      slug: listings.slug,
      coverImageUrl: listings.coverImageUrl,
      affiliateUrl: listings.affiliateUrl,
      firstSeenAt: listings.firstSeenAt,
      catalogStale: listings.catalogStale,
      linkStatus: listings.linkStatus,
    })
    .from(listings)
    .where(
      and(
        gte(listings.firstSeenAt, since),
        eq(listings.catalogStale, false),
        eq(listings.linkStatus, "ok"),
      ),
    )
    .orderBy(desc(listings.firstSeenAt))
    .limit(200);

  result.scanned = candidateListings.length;
  if (!candidateListings.length) return result;

  const eligibility = await loadNewsletterPickEligibilityContext(
    db,
    candidateListings.map((l) => l.id),
  );

  const countsByPlatform: Record<SocialPlatform, number> = {
    mastodon: 0,
    pillowfort: 0,
  };

  for (const listing of candidateListings) {
    const ctx = eligibility.get(listing.id);
    const assessment = assessNewsletterPickEligibility({
      listingId: listing.id,
      title: listing.title,
      slug: listing.slug,
      source: ctx?.source ?? null,
      externalId: ctx?.externalId ?? null,
      tagSlugs: ctx?.tagSlugs ?? [],
      candidateReviewStatus: ctx?.candidateReviewStatus ?? null,
      candidateRawPayload: ctx?.candidateRawPayload ?? null,
    });

    if (!assessment.eligible) {
      result.skippedIneligible += 1;
      continue;
    }

    const payload = buildSocialPostPayload({
      title: listing.title,
      slug: listing.slug,
      coverImageUrl: listing.coverImageUrl,
      affiliateUrl: listing.affiliateUrl,
    });

    for (const platform of platforms) {
      if (countsByPlatform[platform] >= maxPerPlatform) continue;

      const key = `${listing.id}:${platform}`;
      if (existingKeys.has(key)) {
        result.skippedExisting += 1;
        continue;
      }

      await db.insert(socialOutbox).values({
        listingId: listing.id,
        platform,
        status: "pending",
        payload,
      });

      existingKeys.add(key);
      countsByPlatform[platform] += 1;
      result.byPlatform[platform] += 1;
      result.enqueued += 1;
    }

    const allFull = platforms.every((p) => countsByPlatform[p] >= maxPerPlatform);
    if (allFull) break;
  }

  return result;
}

export async function countSocialPostedToday(
  db: CatalogDb,
  platform: SocialPlatform,
): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(socialOutbox)
    .where(
      and(
        eq(socialOutbox.platform, platform),
        eq(socialOutbox.status, "posted"),
        gte(socialOutbox.postedAt, startOfDay),
      ),
    );
  return Number(rows[0]?.count ?? 0);
}
