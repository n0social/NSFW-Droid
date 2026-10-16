/**
 * Send the weekly member newsletter.
 *
 * Droplet: NEWSLETTER_ENABLED=1 and NEWSLETTER_TRANSPORT=sendmail (Exim on localhost).
 * Brevo remains available when NEWSLETTER_TRANSPORT=brevo and BREVO_API_KEY is set.
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
import { checkBrevoDomainDns } from "../src/lib/newsletter/brevo-dns";
import { checkLocalMailDns } from "../src/lib/newsletter/local-dns";
import { newsletterTransport } from "../src/lib/newsletter/send";
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

  const transport = newsletterTransport();
  if (transport === "brevo" && !process.env.BREVO_API_KEY?.trim()) {
    console.error("[send-weekly-newsletter] Missing BREVO_API_KEY");
    await closeCatalogDb();
    process.exit(1);
  }

  if (!subscribers.length) {
    console.error("[send-weekly-newsletter] No active subscribers");
    await closeCatalogDb();
    process.exit(1);
  }

  if (!skipDns) {
    const dns =
      transport === "sendmail"
        ? await checkLocalMailDns(summary.from)
        : await checkBrevoDomainDns(summary.from);
    if (dns.issues.length) {
      console.error(
        "[send-weekly-newsletter] DNS issues (fix before live send):",
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
  const messageIds: string[] = [];

  for (const sub of subscribers) {
    const result = await sendWeeklyNewsletterToSubscriber(sub, pickResult.picks);

    if (result.ok) {
      sent += 1;
      messageIds.push(result.messageId);
      console.log(`[send-weekly-newsletter] queued ${sub.email} messageId=${result.messageId}`);
    } else {
      failed += 1;
      console.error(`[send-weekly-newsletter] failed ${sub.email}: ${result.error}`);
    }
  }

  console.log(
    JSON.stringify({ ...summary, dryRun: false, sent, failed, messageIds }, null, 2),
  );
  await closeCatalogDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
