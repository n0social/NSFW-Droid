import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ingestRuns } from "@/db/schema";

/** Last finished_at of a successful full catalog ingest (`ingest_all`). */
export async function getCatalogLastIngestAt(): Promise<Date | null> {
  const db = await getDb();
  const [row] = await db
    .select({ finishedAt: ingestRuns.finishedAt })
    .from(ingestRuns)
    .where(and(eq(ingestRuns.job, "ingest_all"), eq(ingestRuns.status, "ok")))
    .orderBy(desc(ingestRuns.finishedAt))
    .limit(1);
  return row?.finishedAt ?? null;
}
