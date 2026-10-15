import { getDb } from "@/db";
import { ingestRuns } from "@/db/schema";

export type IngestRunStatus = "ok" | "error";

export async function recordIngestRun(input: {
  job: string;
  status: IngestRunStatus;
  startedAt: Date;
  finishedAt?: Date;
  summary?: Record<string, unknown>;
  errorMessage?: string | null;
}) {
  try {
    const db = await getDb();
    await db.insert(ingestRuns).values({
      job: input.job,
      status: input.status,
      startedAt: input.startedAt,
      finishedAt: input.finishedAt ?? new Date(),
      summary: input.summary ?? null,
      errorMessage: input.errorMessage ?? null,
    });
  } catch (err) {
    console.error("[ingest_run] record failed:", err);
  }
}
