import { sendBrevoEmail } from "@/lib/newsletter/brevo";
import { sendViaSendmail } from "@/lib/newsletter/sendmail";

export type NewsletterSendInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  listUnsubscribeUrl?: string;
};

export type NewsletterSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

/** Droplet Exim (`sendmail`) or Brevo. Explicit env wins; otherwise Brevo only when a key is set. */
export function newsletterTransport(): "sendmail" | "brevo" {
  const raw = process.env.NEWSLETTER_TRANSPORT?.trim().toLowerCase();
  if (raw === "sendmail" || raw === "local") return "sendmail";
  if (raw === "brevo") return "brevo";
  if (process.env.BREVO_API_KEY?.trim()) return "brevo";
  return "sendmail";
}

export async function sendNewsletterEmail(
  input: NewsletterSendInput,
): Promise<NewsletterSendResult> {
  if (newsletterTransport() === "brevo") {
    return sendBrevoEmail(input);
  }
  return sendViaSendmail(input);
}
