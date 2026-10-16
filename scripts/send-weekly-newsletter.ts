/**
 * Send the weekly member newsletter via Resend.
 *
 * Prerequisites: NEWSLETTER_ENABLED=1, RESEND_API_KEY, ALERT_EMAIL_FROM (or onboarding@resend.dev)
 *
 * Usage:
 *   tsx scripts/send-weekly-newsletter.ts --dry-run
 *   tsx scripts/send-weekly-newsletter.ts
 */
import "dotenv/config";
import { closeCatalogDb, getDb } from "../src/db";
import {
  isNewsletterMassSendEnabled,
  newsletterFromAddress,
  WEEKLY_NEWSLETTER_SUBJECT,
} from "../src/lib/newsletter/config";
import { fetchWeeklyNewsletterPicks } from "../src/lib/newsletter/picks";
import { checkResendMailFromDns } from "../src/lib/newsletter/resend-dns";
import { sendWeeklyNewsletterToSubscriber } from "../src/lib/newsletter/send-weekly-to-subscriber";
import { listActiveSubscribers } from "../src/lib/newsletter/subscriber";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const skipDns = process.argv.includes("--skip-dns-check");

  if (!isNewsletterMassSendEnabled()) {
    console.log(
      "[send-weekly-newsletter] NEWSLETTER_ENABLED is not 1 — aborting (no mass send).",
    );
    process.exit(0);
  }

  const db = await getDb();
  const pickResult = await fetchWeeklyNewsletterPicks(db);
  const subscribers = await listActiveSubscribers();

  const summary = {
    dryRun,
    subject: WEEKLY_NEWSLETTER_SUBJECT,
    from: newsletterFromAddress(),
    pickCount: pickResult.picks.length,
    subscriberCount: subscribers.length,
    windowDays: pickResult.windowDays,
    topPick: pickResult.picks[0]?.title ?? null,
  };

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    await closeCatalogDb();
    return;
  }

  if (!pickResult.picks.length) {
    console.error("[send-weekly-newsletter] No picks — skip send");
    await closeCatalogDb();
    process.exit(1);
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    console.error("[send-weekly-newsletter] Missing RESEND_API_KEY");
    await closeCatalogDb();
    process.exit(1);
  }

  if (!subscribers.length) {
    console.error("[send-weekly-newsletter] No active subscribers");
    await closeCatalogDb();
    process.exit(1);
  }

  if (!skipDns) {
    const dns = await checkResendMailFromDns(summary.from);
    if (dns.issues.length) {
      console.error(
        "[send-weekly-newsletter] Resend DNS issues (mail may be dropped after API accept):",
        dns.issues.join(" | "),
      );
      process.exit(1);
    }
    if (dns.warnings.length) {
      console.warn("[send-weekly-newsletter] DNS warnings:", dns.warnings.join(" | "));
    }
  }

  let sent = 0;
  let failed = 0;
  const resendIds: string[] = [];

  for (const sub of subscribers) {
    const result = await sendWeeklyNewsletterToSubscriber(sub, pickResult.picks);

    if (result.ok) {
      sent += 1;
      resendIds.push(result.resendId);
      console.log(`[send-weekly-newsletter] queued ${sub.email} resendId=${result.resendId}`);
    } else {
      failed += 1;
      console.error(`[send-weekly-newsletter] failed ${sub.email}: ${result.error}`);
    }
  }

  console.log(
    JSON.stringify({ ...summary, dryRun: false, sent, failed, resendIds }, null, 2),
  );
  await closeCatalogDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
