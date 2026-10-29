import { newsletterPublicBaseUrl, WEEKLY_NEWSLETTER_SUBJECT } from "@/lib/newsletter/config";
import type { WeeklyPick } from "@/lib/newsletter/picks";
import { sendNewsletterEmail, type SendNewsletterEmailResult } from "@/lib/newsletter/send-email";
import {
  renderWeeklyNewsletterHtml,
  renderWeeklyNewsletterText,
} from "@/lib/newsletter/weekly-email";
import { createUnsubscribeToken } from "@/lib/newsletter/tokens";

export async function sendWeeklyNewsletterToSubscriber(
  subscriber: { id: string; email: string },
  picks: WeeklyPick[],
): Promise<SendNewsletterEmailResult> {
  const base = newsletterPublicBaseUrl();
  const unsubToken = createUnsubscribeToken(subscriber.id);
  const unsubscribeUrl = `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubToken)}`;

  return sendNewsletterEmail({
    to: subscriber.email,
    subject: WEEKLY_NEWSLETTER_SUBJECT,
    html: renderWeeklyNewsletterHtml({ picks, unsubscribeUrl }),
    text: renderWeeklyNewsletterText({ picks, unsubscribeUrl }),
    listUnsubscribeUrl: unsubscribeUrl,
  });
}
