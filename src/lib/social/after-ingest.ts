import type { CatalogDb } from "@/db";
import { isSocialEnqueueEnabled, socialDrainLimitPerRun } from "@/lib/social/config";
import { drainSocialOutbox, type SocialDrainResult } from "@/lib/social/drain";
import { enqueueSocialForNewListings, type SocialEnqueueResult } from "@/lib/social/enqueue";
import { appendSocialLog } from "@/lib/social/log";

export type SocialAfterIngestResult = {
  skipped?: string;
  enqueue?: SocialEnqueueResult;
  drain?: SocialDrainResult;
};

export async function runSocialPipelineAfterIngest(
  db: CatalogDb,
): Promise<SocialAfterIngestResult> {
  if (!isSocialEnqueueEnabled()) return { skipped: "social_not_enabled" };
  const enqueue = await enqueueSocialForNewListings(db);
  const drain = await drainSocialOutbox(db, { limit: socialDrainLimitPerRun() });
  return { enqueue, drain };
}

export function logSocialAfterIngest(result: SocialAfterIngestResult): void {
  appendSocialLog({ event: "after_ingest", ...result });
}
