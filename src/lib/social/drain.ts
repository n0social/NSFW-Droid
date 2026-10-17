import { asc, eq } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { socialOutbox } from "@/db/schema";
import type { SocialPostPayload } from "@/lib/social/compose";
import { countSocialPostedToday } from "@/lib/social/enqueue";
import {
  isMastodonSocialEnabled,
  isPillowfortSocialEnabled,
  isSocialDryRun,
  mastodonAttachCover,
  socialMaxPerDay,
  type SocialPlatform,
} from "@/lib/social/config";
import { postMastodonStatus } from "@/lib/social/mastodon";

export type SocialDrainResult = {
  processed: number;
  posted: number;
  failed: number;
  skipped: number;
  byPlatform: Record<SocialPlatform, { posted: number; failed: number; skipped: number }>;
};

function payloadFromRow(raw: unknown): SocialPostPayload {
  const p = raw as SocialPostPayload;
  if (!p?.title || !p?.url || !p?.slug) {
    throw new Error("invalid_social_payload");
  }
  return p;
}

export async function drainSocialOutbox(
  db: CatalogDb,
  options?: { limit?: number },
): Promise<SocialDrainResult> {
  const limit = options?.limit ?? 10;
  const dryRun = isSocialDryRun();

  const result: SocialDrainResult = {
    processed: 0,
    posted: 0,
    failed: 0,
    skipped: 0,
    byPlatform: {
      mastodon: { posted: 0, failed: 0, skipped: 0 },
      pillowfort: { posted: 0, failed: 0, skipped: 0 },
    },
  };

  const pending = await db
    .select()
    .from(socialOutbox)
    .where(eq(socialOutbox.status, "pending"))
    .orderBy(asc(socialOutbox.createdAt))
    .limit(limit);

  for (const row of pending) {
    result.processed += 1;
    const platform = row.platform as SocialPlatform;

    const postedToday = await countSocialPostedToday(db, platform);
    if (postedToday >= socialMaxPerDay()) {
      result.skipped += 1;
      result.byPlatform[platform].skipped += 1;
      continue;
    }

    if (platform === "pillowfort") {
      if (!isPillowfortSocialEnabled()) {
        await db
          .update(socialOutbox)
          .set({
            status: "skipped",
            error: "pillowfort_manual_or_api_not_configured",
            updatedAt: new Date(),
          })
          .where(eq(socialOutbox.id, row.id));
        result.skipped += 1;
        result.byPlatform.pillowfort.skipped += 1;
        continue;
      }
      await db
        .update(socialOutbox)
        .set({
          status: "skipped",
          error: "pillowfort_adapter_not_implemented",
          updatedAt: new Date(),
        })
        .where(eq(socialOutbox.id, row.id));
      result.skipped += 1;
      result.byPlatform.pillowfort.skipped += 1;
      continue;
    }

    if (platform === "mastodon" && !isMastodonSocialEnabled() && !dryRun) {
      result.skipped += 1;
      result.byPlatform.mastodon.skipped += 1;
      continue;
    }

    try {
      const payload = payloadFromRow(row.payload);
      let externalId: string;
      if (platform === "mastodon") {
        const post = await postMastodonStatus(payload, {
          attachCover: mastodonAttachCover(),
          dryRun,
        });
        externalId = post.id;
      } else {
        throw new Error(`unsupported_platform:${platform}`);
      }

      await db
        .update(socialOutbox)
        .set({
          status: "posted",
          externalId,
          error: null,
          postedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(socialOutbox.id, row.id));

      result.posted += 1;
      result.byPlatform[platform].posted += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(socialOutbox)
        .set({
          status: "failed",
          error: message.slice(0, 2000),
          updatedAt: new Date(),
        })
        .where(eq(socialOutbox.id, row.id));
      result.failed += 1;
      result.byPlatform[platform].failed += 1;
    }
  }

  return result;
}
