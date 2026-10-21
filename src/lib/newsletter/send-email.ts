import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { sendBrevoEmail, type SendBrevoEmailResult } from "@/lib/newsletter/brevo";
import { newsletterFromAddress, newsletterTransport } from "@/lib/newsletter/config";

export type NewsletterEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  listUnsubscribeUrl?: string;
};

export type SendNewsletterEmailResult = SendBrevoEmailResult;

function assertHeaderValue(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed || /[\r\n]/.test(trimmed)) {
    throw new Error(`invalid_${label}`);
  }
  return trimmed;
}

/** RFC 822 message for `sendmail -t`. Exported for tests. */
export function buildSendmailMessage(input: NewsletterEmailInput): string {
  const to = assertHeaderValue(input.to, "to");
  const subject = assertHeaderValue(input.subject, "subject");
  const from = assertHeaderValue(newsletterFromAddress(), "from");
  const boundary = `nsfwdroid_${randomBytes(12).toString("hex")}`;
  const text = input.text?.replace(/\r\n/g, "\n") ?? "";
  const html = input.html.replace(/\r\n/g, "\n");
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  if (input.listUnsubscribeUrl?.trim()) {
    const url = assertHeaderValue(input.listUnsubscribeUrl, "list_unsubscribe");
    lines.push(`List-Unsubscribe: <${url}>`, "List-Unsubscribe-Post: List-Unsubscribe=One-Click");
  }
  lines.push(
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    `--${boundary}--`,
    "",
  );
  return lines.join("\r\n");
}

function sendmailBinary(): string {
  const fromEnv = process.env.SENDMAIL_PATH?.trim();
  if (fromEnv) return fromEnv;
  return "/usr/sbin/sendmail";
}

export async function sendViaSendmail(
  input: NewsletterEmailInput,
): Promise<SendNewsletterEmailResult> {
  let message: string;
  try {
    message = buildSendmailMessage(input);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { ok: false, error };
  }

  const bin = sendmailBinary();
  return new Promise((resolve) => {
    const child = spawn(bin, ["-t", "-oi"], { stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += String(chunk);
    });
    child.on("error", (err) => {
      resolve({ ok: false, error: `sendmail_spawn:${err.message}` });
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ ok: true, messageId: `sendmail:${randomBytes(8).toString("hex")}` });
        return;
      }
      resolve({
        ok: false,
        error: `sendmail_exit_${code ?? "null"}:${stderr.slice(0, 200)}`,
      });
    });
    child.stdin.write(message);
    child.stdin.end();
  });
}

export async function sendNewsletterEmail(
  input: NewsletterEmailInput,
): Promise<SendNewsletterEmailResult> {
  if (newsletterTransport() === "sendmail") {
    return sendViaSendmail(input);
  }
  return sendBrevoEmail(input);
}
