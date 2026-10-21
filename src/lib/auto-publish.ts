import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { candidateTags, candidates, tags } from "@/db/schema";
import {
  isCatalogNsfwEnforcementEnabled,
  isMatureCatalogCandidate,
} from "@/lib/catalog-maturity";
import { approveCandidate, rejectCandidate } from "@/lib/review";
import {
  screenCandidateFields,
  tosRuleLabel,
  type TosScreenResult,
} from "@/lib/tos-screen";

export type CandidateIngestOutcome =
  | "published"
  | "held"
  | "pending"
  | "skipped"
  | "rejected_non_mature"
  | "publish_failed";

export type AutoPublishError = {
  candidateId: string;
  title: string;
  error: string;
};

function parseEnvBool(value: string | undefined): boolean | undefined {
  if (value === undefined || value === "") return undefined;
  const v = value.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  return undefined;
}

/** When true, passing TOS checks promotes candidate → listing without admin action. */
export function isIngestAutoPublishEnabled(): boolean {
  const requireReview = parseEnvBool(process.env.INGEST_REQUIRE_REVIEW);
  if (requireReview === true) return false;

  const auto = parseEnvBool(process.env.AUTO_PUBLISH);
  if (auto === false) return false;
  if (auto === true) return true;

  const demo = parseEnvBool(process.env.DEMO_AUTO_PUBLISH);
  if (demo === true) return true;

  return process.env.NODE_ENV === "production";
}

export function readTosHold(rawPayload: unknown): {
  held: boolean;
  matchedRules: string[];
  heldAt?: string;
} | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;
  const tos = (rawPayload as {
    tosScreen?: { hold?: boolean; matchedRules?: string[]; heldAt?: string };
  }).tosScreen;
  if (!tos?.hold) return null;
  return {
    held: true,
    matchedRules: tos.matchedRules ?? [],
    heldAt: tos.heldAt,
  };
}

async function markTosHold(
  candidateId: string,
  existingPayload: unknown,
  screen: TosScreenResult,
) {
  const db = await getDb();
  const base =
    existingPayload && typeof existingPayload === "object"
      ? { ...(existingPayload as Record<string, unknown>) }
      : {};
  const summaries = screen.matchedRules.map((id) => tosRuleLabel(id));
  base.tosScreen = {
    hold: true,
    matchedRules: screen.matchedRules,
    summary: summaries.join("; "),
    heldAt: new Date().toISOString(),
  };
  await db
    .update(candidates)
    .set({ rawPayload: base })
    .where(eq(candidates.id, candidateId));
}

async function tagSlugsForCandidate(candidateId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ slug: tags.slug })
    .from(candidateTags)
    .innerJoin(tags, eq(candidateTags.tagId, tags.id))
    .where(eq(candidateTags.candidateId, candidateId));
  return rows.map((r) => r.slug);
}

function affiliateFromRaw(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const url = (raw as { affiliate_url?: string }).affiliate_url;
  return url?.trim() ? url.trim() : null;
}

/**
 * Run after a new pending candidate is written.
 * Applies TOS hold metadata; auto-publishes when enabled and clear.
 */
export async function processCandidateAfterIngest(
  candidateId: string,
): Promise<CandidateIngestOutcome> {
  const db = await getDb();
  const [c] = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
  if (!c || c.reviewStatus !== "pending") return "skipped";

  const screen = screenCandidateFields({
    title: c.title,
    outboundUrl: c.outboundUrl,
    rawPayload: c.rawPayload,
  });

  if (screen.hold) {
    await markTosHold(candidateId, c.rawPayload, screen);
    return "held";
  }

  if (isCatalogNsfwEnforcementEnabled()) {
    const tagSlugs = await tagSlugsForCandidate(candidateId);
    if (!isMatureCatalogCandidate(c, tagSlugs)) {
      await rejectCandidate(candidateId, "catalog_maturity", "not_mature_catalog");
      return "rejected_non_mature";
    }
  }

  if (!isIngestAutoPublishEnabled()) return "pending";

  const raw = c.rawPayload as { platforms?: string[] } | null;
  try {
    const listing = await approveCandidate(candidateId, "auto_publish", {
      platforms: raw?.platforms,
      affiliateUrl: affiliateFromRaw(c.rawPayload),
    });
    return listing ? "published" : "skipped";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const payload =
      c.rawPayload && typeof c.rawPayload === "object"
        ? { ...(c.rawPayload as Record<string, unknown>) }
        : {};
    payload.publishError = {
      phase: "auto_publish",
      message,
      at: new Date().toISOString(),
    };
    await db
      .update(candidates)
      .set({ rawPayload: payload })
      .where(eq(candidates.id, candidateId));
    return "publish_failed";
  }
}

/** End-of-ingest sweep for pending rows (env toggled on, or missed per-row). */
export async function autoPublishPendingCandidates(limit = 100): Promise<{
  published: number;
  held: number;
  pending: number;
  skipped: number;
  rejectedNonMature: number;
  publishFailed: number;
  publishErrors: AutoPublishError[];
}> {
  const db = await getDb();
  const pending = await db
    .select()
    .from(candidates)
    .where(eq(candidates.reviewStatus, "pending"))
    .limit(limit);

  let published = 0;
  let held = 0;
  let stillPending = 0;
  let skipped = 0;
  let rejectedNonMature = 0;
  let publishFailed = 0;
  const publishErrors: AutoPublishError[] = [];

  for (const c of pending) {
    const outcome = await processCandidateAfterIngest(c.id);
    if (outcome === "published") published += 1;
    else if (outcome === "held") held += 1;
    else if (outcome === "pending") stillPending += 1;
    else if (outcome === "rejected_non_mature") rejectedNonMature += 1;
    else if (outcome === "publish_failed") {
      publishFailed += 1;
      if (publishErrors.length < 8) {
        const [row] = await db
          .select({ rawPayload: candidates.rawPayload })
          .from(candidates)
          .where(eq(candidates.id, c.id))
          .limit(1);
        const pl = row?.rawPayload as { publishError?: { message?: string } } | null;
        publishErrors.push({
          candidateId: c.id,
          title: c.title,
          error: pl?.publishError?.message ?? "publish_failed",
        });
      }
    } else skipped += 1;
  }

  return {
    published,
    held,
    pending: stillPending,
    skipped,
    rejectedNonMature,
    publishFailed,
    publishErrors,
  };
}
