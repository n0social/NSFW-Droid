import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { analyticsEvents, listings } from "@/db/schema";
import {
  assessNewsletterPickEligibility,
  loadNewsletterPickEligibilityContext,
} from "@/lib/newsletter/pick-eligibility";

export const PICK_COUNT = 6;
const DEFAULT_DAYS = 7;
const DEFAULT_CLICK_WEIGHT = 2;
/** How many ranked rows to consider before eligibility filtering. */
const CANDIDATE_POOL = 80;

export type WeeklyPick = {
  rank: number;
  listingId: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  views: number;
  clicks: number;
  score: number;
};

export async function fetchWeeklyNewsletterPicks(db: CatalogDb): Promise<{
  windowDays: number;
  clickWeight: number;
  since: string;
  picks: WeeklyPick[];
  filteredCount: number;
}> {
  const days = Number(process.env.NEWSLETTER_RANK_DAYS?.trim() || DEFAULT_DAYS);
  const clickWeight = Number(
    process.env.NEWSLETTER_CLICK_WEIGHT?.trim() || DEFAULT_CLICK_WEIGHT,
  );
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      listingId: analyticsEvents.listingId,
      views: sql<number>`count(*) filter (where ${analyticsEvents.eventType} = 'listing_view')::int`,
      clicks: sql<number>`count(*) filter (where ${analyticsEvents.eventType} = 'outbound_click')::int`,
      title: listings.title,
      slug: listings.slug,
      coverImageUrl: listings.coverImageUrl,
    })
    .from(analyticsEvents)
    .innerJoin(listings, eq(listings.id, analyticsEvents.listingId))
    .where(
      and(
        gte(analyticsEvents.createdAt, since),
        isNotNull(analyticsEvents.listingId),
        eq(listings.catalogStale, false),
        eq(listings.linkStatus, "ok"),
        sql`${listings.publishedAt} IS NOT NULL`,
      ),
    )
    .groupBy(
      analyticsEvents.listingId,
      listings.title,
      listings.slug,
      listings.coverImageUrl,
    )
    .having(
      sql`count(*) filter (where ${analyticsEvents.eventType} in ('listing_view', 'outbound_click')) > 0`,
    );

  const scored = rows
    .filter((r) => r.listingId)
    .map((r) => ({
      listingId: r.listingId!,
      title: r.title,
      slug: r.slug,
      coverImageUrl: r.coverImageUrl,
      views: r.views,
      clicks: r.clicks,
      score: r.views + r.clicks * clickWeight,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.clicks !== a.clicks) return b.clicks - a.clicks;
      return a.listingId.localeCompare(b.listingId);
    })
    .slice(0, CANDIDATE_POOL);

  const poolIds = scored.map((r) => r.listingId);
  const eligibilityCtx = await loadNewsletterPickEligibilityContext(db, poolIds);

  let filteredCount = 0;
  const eligible: typeof scored = [];
  for (const row of scored) {
    const ctx = eligibilityCtx.get(row.listingId);
    const assessment = assessNewsletterPickEligibility({
      listingId: row.listingId,
      title: row.title,
      slug: row.slug,
      source: ctx?.source ?? null,
      externalId: ctx?.externalId ?? null,
      tagSlugs: ctx?.tagSlugs ?? [],
      candidateReviewStatus: ctx?.candidateReviewStatus ?? null,
      candidateRawPayload: ctx?.candidateRawPayload ?? null,
    });
    if (!assessment.eligible) {
      filteredCount += 1;
      continue;
    }
    eligible.push(row);
    if (eligible.length >= PICK_COUNT) break;
  }

  const picks = eligible.map((row, i) => ({ rank: i + 1, ...row }));

  return {
    windowDays: days,
    clickWeight,
    since: since.toISOString(),
    picks,
    filteredCount,
  };
}
