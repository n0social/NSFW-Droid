import { eq } from "drizzle-orm";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { approveCandidate } from "@/lib/review";
import {
  screenCandidateFields,
  tosRuleLabel,
  type TosScreenResult,
} from "@/lib/tos-screen";

export type CandidateIngestOutcome = "published" | "held" | "pending" | "skipped";

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

  if (!isIngestAutoPublishEnabled()) return "pending";

  const raw = c.rawPayload as { platforms?: string[] } | null;
  const listing = await approveCandidate(candidateId, "auto_publish", {
    platforms: raw?.platforms,
    affiliateUrl: affiliateFromRaw(c.rawPayload),
  });
  return listing ? "published" : "skipped";
}

/** End-of-ingest sweep for pending rows (env toggled on, or missed per-row). */
export async function autoPublishPendingCandidates(limit = 100): Promise<{
  published: number;
  held: number;
  pending: number;
  skipped: number;
}> {
  const pending = await db
    .select()
    .from(candidates)
    .where(eq(candidates.reviewStatus, "pending"))
    .limit(limit);

  let published = 0;
  let held = 0;
  let stillPending = 0;
  let skipped = 0;

  for (const c of pending) {
    const outcome = await processCandidateAfterIngest(c.id);
    if (outcome === "published") published += 1;
    else if (outcome === "held") held += 1;
    else if (outcome === "pending") stillPending += 1;
    else skipped += 1;
  }

  return { published, held, pending: stillPending, skipped };
}
