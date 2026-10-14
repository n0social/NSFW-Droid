import { db } from "../../src/db";
import { candidates, ingestSources } from "../../src/db/schema";
import {
  autoPublishPendingCandidates,
  processCandidateAfterIngest,
} from "../../src/lib/auto-publish";

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
}): Promise<boolean> {
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

  if (result.length > 0) {
    await processCandidateAfterIngest(result[0].id).catch(() => {});
    return true;
  }

  return false;
}

export async function touchIngestSource(
  name: string,
  cursor: Record<string, unknown>,
  lastError: string | null = null,
) {
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
