import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { processCandidateAfterIngest } from "@/lib/auto-publish";

export async function upsertCandidate(input: {
  source: "itch" | "steam" | "developer_form" | "manual" | "affiliate_export";
  externalId: string;
  title: string;
  outboundUrl: string;
  rawPayload?: unknown;
}): Promise<{ inserted: boolean; id: string | null }> {
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
    const id = result[0].id;
    await processCandidateAfterIngest(id).catch(() => {});
    return { inserted: true, id };
  }
  const [existing] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(
      and(eq(candidates.source, input.source), eq(candidates.externalId, input.externalId)),
    )
    .limit(1);
  return { inserted: false, id: existing?.id ?? null };
}
