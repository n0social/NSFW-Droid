import {
  sendViaSendmail,
  type SendmailInput,
  type SendmailResult,
} from "@/lib/newsletter/sendmail";

export type NewsletterSendInput = SendmailInput;
export type NewsletterSendResult = SendmailResult;

/** Newsletter mail is always sent via the droplet MTA (`sendmail` → Exim). */
export function newsletterTransport(): "sendmail" {
  const raw = process.env.NEWSLETTER_TRANSPORT?.trim().toLowerCase();
  if (raw && raw !== "sendmail" && raw !== "local") {
    console.warn(
      `[newsletter] NEWSLETTER_TRANSPORT=${raw} is ignored; only sendmail is supported.`,
    );
  }
  return "sendmail";
}

export async function sendNewsletterEmail(
  input: NewsletterSendInput,
): Promise<NewsletterSendResult> {
  return sendViaSendmail(input);
}
