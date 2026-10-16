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
  newsletterPublicBaseUrl,
  WEEKLY_NEWSLETTER_SUBJECT,
} from "../src/lib/newsletter/config";
import { fetchWeeklyNewsletterPicks } from "../src/lib/newsletter/picks";
import { sendResendEmail } from "../src/lib/newsletter/resend";
import { listActiveSubscribers } from "../src/lib/newsletter/subscriber";
import {
  renderWeeklyNewsletterHtml,
  renderWeeklyNewsletterText,
} from "../src/lib/newsletter/weekly-email";
import { createUnsubscribeToken } from "../src/lib/newsletter/tokens";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!isNewsletterMassSendEnabled()) {
    console.log(
      "[send-weekly-newsletter] NEWSLETTER_ENABLED is not 1 — aborting (no mass send).",
    );
    process.exit(0);
  }

  const db = await getDb();
  const pickResult = await fetchWeeklyNewsletterPicks(db);
  const subscribers = await listActiveSubscribers();

  const base = newsletterPublicBaseUrl();
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

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    const unsubToken = createUnsubscribeToken(sub.id);
    const unsubscribeUrl = `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
    const html = renderWeeklyNewsletterHtml({
      picks: pickResult.picks,
      unsubscribeUrl,
    });
    const text = renderWeeklyNewsletterText({
      picks: pickResult.picks,
      unsubscribeUrl,
    });

    const result = await sendResendEmail({
      to: sub.email,
      subject: WEEKLY_NEWSLETTER_SUBJECT,
      html,
      text,
    });

    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      console.error(`[send-weekly-newsletter] failed ${sub.email}: ${result.error}`);
    }
  }

  console.log(
    JSON.stringify({ ...summary, dryRun: false, sent, failed }, null, 2),
  );
  await closeCatalogDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
