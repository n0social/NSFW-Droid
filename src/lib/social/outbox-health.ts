import { sql } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { isSocialEnqueueEnabled } from "@/lib/social/config";

export type SocialOutboxCounts = {
  pending: number;
  posted: number;
  failed: number;
  skipped: number;
};

export type SocialHealthSnapshot = {
  enabled: boolean;
  outbox?: SocialOutboxCounts;
};

export async function getSocialOutboxCounts(db: CatalogDb): Promise<SocialOutboxCounts> {
  const result = await db.execute(sql`
    SELECT status, count(*)::int AS count
    FROM social_outbox
    GROUP BY status
  `);

  const counts: SocialOutboxCounts = {
    pending: 0,
    posted: 0,
    failed: 0,
    skipped: 0,
  };

  for (const row of result.rows as { status: string; count: number }[]) {
    const status = row.status as keyof SocialOutboxCounts;
    if (status in counts) counts[status] = Number(row.count ?? 0);
  }

  return counts;
}

function healthSocialOutboxRequested(): boolean {
  const raw = process.env.HEALTH_SOCIAL_OUTBOX?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no") return false;
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  return isSocialEnqueueEnabled();
}

export async function getSocialHealthSnapshot(
  db: CatalogDb,
): Promise<SocialHealthSnapshot | null> {
  if (!healthSocialOutboxRequested()) return null;
  if (!isSocialEnqueueEnabled()) return { enabled: false };
  const outbox = await getSocialOutboxCounts(db);
  return { enabled: true, outbox };
}
