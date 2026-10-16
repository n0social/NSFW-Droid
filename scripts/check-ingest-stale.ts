/**
 * Alert when the last N ingest_all runs inserted zero new candidates.
 * Env: INGEST_ALERT_ZERO_NEW_RUNS (unset or 0 = disabled).
 * Prints one JSON line to stdout for check-ingest-stale.sh.
 */
import "dotenv/config";
import { desc, eq } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";
import { ingestRuns } from "../src/db/schema";

function zeroNewTotal(summary: unknown): boolean {
  if (!summary || typeof summary !== "object") return false;
  const inserted = (summary as Record<string, unknown>).newCandidatesInserted as
    | { total?: number }
    | undefined;
  return inserted?.total === 0;
}

async function main() {
  const n = Number(process.env.INGEST_ALERT_ZERO_NEW_RUNS ?? "0");
  if (!Number.isFinite(n) || n < 1) {
    console.log(JSON.stringify({ shouldAlert: false, reason: "disabled" }));
    return;
  }

  const db = await getDb();
  const runs = await db
    .select({
      status: ingestRuns.status,
      startedAt: ingestRuns.startedAt,
      finishedAt: ingestRuns.finishedAt,
      summary: ingestRuns.summary,
    })
    .from(ingestRuns)
    .where(eq(ingestRuns.job, "ingest_all"))
    .orderBy(desc(ingestRuns.startedAt))
    .limit(n);

  if (runs.length < n) {
    console.log(
      JSON.stringify({ shouldAlert: false, reason: "insufficient_history", have: runs.length, need: n }),
    );
    return;
  }

  const allOkZero = runs.every((r) => r.status === "ok" && zeroNewTotal(r.summary));
  if (!allOkZero) {
    console.log(JSON.stringify({ shouldAlert: false, reason: "not_all_zero" }));
    return;
  }

  const oldest = runs[runs.length - 1]!;
  const newest = runs[0]!;
  const body = [
    `The last ${n} ingest_all run(s) completed with newCandidatesInserted.total = 0.`,
    "",
    `Oldest in window: ${oldest.startedAt.toISOString()}`,
    `Latest: ${newest.finishedAt?.toISOString() ?? newest.startedAt.toISOString()}`,
    "",
    "Check /var/log/nsfwdroid-ingest.log, itch feeds, and admin ingest runs.",
    "Tune or disable: INGEST_ALERT_ZERO_NEW_RUNS in /etc/nsfwdroid.env",
  ].join("\n");

  console.log(
    JSON.stringify({
      shouldAlert: true,
      runs: n,
      body,
      oldestStartedAt: oldest.startedAt.toISOString(),
      newestFinishedAt: newest.finishedAt?.toISOString() ?? null,
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => closeCatalogDb());
