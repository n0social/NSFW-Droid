import { and, eq, inArray, or } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import {
  candidates,
  listingTags,
  listings,
  tags,
} from "@/db/schema";
import { readTosHold } from "@/lib/auto-publish";
import { isBlockedBrowseCatalogTagSlug } from "@/lib/tag-filter";
import { screenCandidateText } from "@/lib/tos-screen";

/** Title patterns excluded from newsletter picks (violent / creepypasta junk). */
const OFFENSIVE_TITLE_PATTERNS: RegExp[] = [
  /\bjack\s*the\s*ripper\b/i,
  /\bjeff\s*the\s*(ripper|killer)\b/i,
  /\bjeff\s*the\s*killer\b/i,
  /\bcreepypasta\b/i,
  /\bserial\s*killer\b/i,
];

export type PickEligibilityInput = {
  listingId: string;
  title: string;
  slug: string;
  source: string | null;
  externalId: string | null;
  tagSlugs: string[];
  candidateReviewStatus: string | null;
  candidateRawPayload: unknown;
};

export type PickEligibilityResult = {
  eligible: boolean;
  reasons: string[];
};

export function isOffensiveNewsletterTitle(title: string): boolean {
  return OFFENSIVE_TITLE_PATTERNS.some((re) => re.test(title));
}

export function assessNewsletterPickEligibility(
  input: PickEligibilityInput,
): PickEligibilityResult {
  const reasons: string[] = [];

  const tos = screenCandidateText(input.title);
  if (tos.hold) {
    reasons.push(`tos_screen:${tos.matchedRules.join(",")}`);
  }

  if (isOffensiveNewsletterTitle(input.title)) {
    reasons.push("offensive_title");
  }

  for (const slug of input.tagSlugs) {
    if (isBlockedBrowseCatalogTagSlug(slug)) {
      reasons.push(`blocked_tag:${slug}`);
      break;
    }
  }

  if (input.candidateReviewStatus && input.candidateReviewStatus !== "approved") {
    reasons.push(`review_status:${input.candidateReviewStatus}`);
  }

  const hold = readTosHold(input.candidateRawPayload);
  if (hold?.held) {
    reasons.push(`tos_hold:${hold.matchedRules.join(",")}`);
  }

  return { eligible: reasons.length === 0, reasons };
}

export async function loadNewsletterPickEligibilityContext(
  db: CatalogDb,
  listingIds: string[],
): Promise<Map<string, Omit<PickEligibilityInput, "title" | "slug">>> {
  const map = new Map<string, Omit<PickEligibilityInput, "title" | "slug">>();
  if (!listingIds.length) return map;

  const listingRows = await db
    .select({
      id: listings.id,
      source: listings.source,
      externalId: listings.externalId,
    })
    .from(listings)
    .where(inArray(listings.id, listingIds));

  const tagRows = await db
    .select({
      listingId: listingTags.listingId,
      slug: tags.slug,
    })
    .from(listingTags)
    .innerJoin(tags, eq(listingTags.tagId, tags.id))
    .where(inArray(listingTags.listingId, listingIds));

  const tagsByListing = new Map<string, string[]>();
  for (const row of tagRows) {
    const list = tagsByListing.get(row.listingId) ?? [];
    list.push(row.slug);
    tagsByListing.set(row.listingId, list);
  }

  const candidateKeys = listingRows
    .filter((r) => r.source && r.externalId)
    .map((r) => ({ source: r.source!, externalId: r.externalId! }));

  const candidateByKey = new Map<
    string,
    { reviewStatus: string; rawPayload: unknown }
  >();

  if (candidateKeys.length) {
    const uniqueKeys = [
      ...new Map(candidateKeys.map((k) => [`${k.source}:${k.externalId}`, k])).values(),
    ];
    const candidateRows = await db
      .select({
        source: candidates.source,
        externalId: candidates.externalId,
        reviewStatus: candidates.reviewStatus,
        rawPayload: candidates.rawPayload,
      })
      .from(candidates)
      .where(
        or(
          ...uniqueKeys.map((k) =>
            and(eq(candidates.source, k.source), eq(candidates.externalId, k.externalId)),
          ),
        ),
      );

    for (const c of candidateRows) {
      candidateByKey.set(`${c.source}:${c.externalId}`, {
        reviewStatus: c.reviewStatus,
        rawPayload: c.rawPayload,
      });
    }
  }

  for (const row of listingRows) {
    const key =
      row.source && row.externalId ? `${row.source}:${row.externalId}` : null;
    const cand = key ? candidateByKey.get(key) : undefined;
    map.set(row.id, {
      listingId: row.id,
      source: row.source,
      externalId: row.externalId,
      tagSlugs: tagsByListing.get(row.id) ?? [],
      candidateReviewStatus: cand?.reviewStatus ?? null,
      candidateRawPayload: cand?.rawPayload ?? null,
    });
  }

  return map;
}
