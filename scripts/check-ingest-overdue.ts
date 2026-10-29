/**
 * Alert when catalogLastIngestAt from /api/health is older than INGEST_ALERT_MAX_AGE_HOURS.
 */
import "dotenv/config";

async function main() {
  const maxHours = Number(process.env.INGEST_ALERT_MAX_AGE_HOURS ?? "0");
  if (!Number.isFinite(maxHours) || maxHours < 1) {
    console.log(JSON.stringify({ shouldAlert: false, reason: "disabled" }));
    return;
  }

  const url = process.env.NSFWDROID_HEALTH_URL ?? "http://127.0.0.1:3000/api/health";
  let body: { status?: string; catalogLastIngestAt?: string | null };
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    body = (await res.json()) as typeof body;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.log(JSON.stringify({ shouldAlert: false, reason: "health_fetch_failed", message }));
    return;
  }

  if (body.status !== "ok") {
    console.log(JSON.stringify({ shouldAlert: false, reason: "health_not_ok", status: body.status }));
    return;
  }

  const last = body.catalogLastIngestAt ?? null;
  if (!last) {
    const text = [
      "catalogLastIngestAt=null while status=ok — no successful ingest_all recorded.",
      "Check /var/log/nsfwdroid-ingest.log.",
    ].join("\n");
    console.log(JSON.stringify({ shouldAlert: true, reason: "missing", body: text }));
    return;
  }

  const ageHours = (Date.now() - new Date(last).getTime()) / (60 * 60 * 1000);
  if (ageHours <= maxHours) {
    console.log(JSON.stringify({ shouldAlert: false, reason: "fresh_enough", ageHours, maxHours }));
    return;
  }

  const text = [
    `catalogLastIngestAt is ${Math.round(ageHours)}h old (threshold ${maxHours}h).`,
    `Last success: ${last}`,
    "",
    "Check /var/log/nsfwdroid-ingest.log and admin ingest runs.",
  ].join("\n");

  console.log(JSON.stringify({ shouldAlert: true, reason: "overdue", body: text }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
