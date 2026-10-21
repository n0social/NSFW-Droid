/** Weekly member newsletter — see docs/newsletter-exim-runbook.md */
import "dotenv/config";
import { closeCatalogDb, getDb } from "../src/db";
import {
  assertNewsletterSigningSecretProduction,
  isNewsletterMassSendEnabled,
  newsletterFromAddress,
  newsletterTransport,
  WEEKLY_NEWSLETTER_SUBJECT,
} from "../src/lib/newsletter/config";
import { formatEmailFailureForOpsAlert } from "../src/lib/newsletter/email-diagnostics";
import { fetchWeeklyNewsletterPicks } from "../src/lib/newsletter/picks";
import { checkBrevoDomainDns } from "../src/lib/newsletter/brevo-dns";
import { sendWeeklyNewsletterToSubscriber } from "../src/lib/newsletter/send-weekly-to-subscriber";
import { listActiveSubscribers } from "../src/lib/newsletter/subscriber";
import {
  recordWeeklySendCompleted,
  shouldSkipWeeklySendBecauseAlreadySent,
  weeklySendWeekKey,
} from "../src/lib/newsletter/weekly-send-guard";

function failOps(summary: string, detail: string): never {
  console.error(`[send-weekly-newsletter] OPS_ALERT\nWhat broke: ${summary}\nTechnical: ${detail}`);
  process.exit(1);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const skipDns = process.argv.includes("--skip-dns-check");
  const forceResend = process.argv.includes("--force-resend");

  if (!isNewsletterMassSendEnabled()) {
    console.log("[send-weekly-newsletter] NEWSLETTER_ENABLED is not 1 — aborting.");
    process.exit(0);
  }

  try {
    assertNewsletterSigningSecretProduction("send-weekly-newsletter");
  } catch (err) {
    failOps(
      "Signing secret not configured",
      err instanceof Error ? err.message : String(err),
    );
  }

  const weekKey = weeklySendWeekKey();
  const guard = shouldSkipWeeklySendBecauseAlreadySent(weekKey, forceResend);
  if (guard.skip && guard.record) {
    console.log(
      `[send-weekly-newsletter] already sent ${weekKey} at ${guard.record.completedAt} — skip`,
    );
    process.exit(0);
  }

  const db = await getDb();
  const pickResult = await fetchWeeklyNewsletterPicks(db);
  const subscribers = await listActiveSubscribers();
  const summary = {
    dryRun,
    weekKey,
    transport: newsletterTransport(),
    subject: WEEKLY_NEWSLETTER_SUBJECT,
    from: newsletterFromAddress(),
    pickCount: pickResult.picks.length,
    subscriberCount: subscribers.length,
  };

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    await closeCatalogDb();
    return;
  }

  if (!pickResult.picks.length) failOps("No picks", `weekKey=${weekKey}`);
  if (!subscribers.length) {
    console.error("[send-weekly-newsletter] No active subscribers");
    await closeCatalogDb();
    process.exit(1);
  }

  const transport = newsletterTransport();
  if (transport === "brevo" && !process.env.BREVO_API_KEY?.trim()) {
    failOps("Missing BREVO_API_KEY", "brevo transport");
  }
  if (transport === "brevo" && !skipDns) {
    const dns = await checkBrevoDomainDns(summary.from);
    if (dns.issues.length) failOps("Brevo DNS issues", dns.issues.join(" | "));
  }

  let sent = 0;
  let failed = 0;
  for (const sub of subscribers) {
    const result = await sendWeeklyNewsletterToSubscriber(sub, pickResult.picks);
    if (result.ok) {
      sent += 1;
      console.log(`[send-weekly-newsletter] ok ${sub.email} ${result.messageId}`);
    } else {
      failed += 1;
      const msg = result.diagnostic
        ? formatEmailFailureForOpsAlert(`weekly:${sub.email}`, result.error, result.diagnostic)
        : result.error;
      console.error(`[send-weekly-newsletter] fail ${sub.email}\n${msg}`);
    }
  }

  console.log(JSON.stringify({ ...summary, sent, failed }, null, 2));
  if (failed) failOps(`${failed} subscriber failure(s)`, `sent=${sent} weekKey=${weekKey}`);
  if (sent) {
    recordWeeklySendCompleted({
      weekKey,
      subscriberCount: subscribers.length,
      sent,
      failed,
      subject: WEEKLY_NEWSLETTER_SUBJECT,
    });
  }
  await closeCatalogDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
