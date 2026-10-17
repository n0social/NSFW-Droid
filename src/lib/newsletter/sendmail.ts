import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { newsletterFromAddress, parseEmailFromEnv } from "@/lib/newsletter/config";

export type SendmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  listUnsubscribeUrl?: string;
};

export type SendmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

const SENDMAIL_BIN = process.env.SENDMAIL_PATH?.trim() || "/usr/sbin/sendmail";

function encodeHeader(value: string): string {
  if (/^[\t\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function wrapBase64(value: string): string {
  return value.replace(/.{1,76}/g, (line) => `${line}\r\n`).trimEnd();
}

/** RFC 5322 message accepted by `sendmail -t`. Exported for the MIME check script. */
export function buildNewsletterMime(input: SendmailInput): {
  raw: string;
  messageId: string;
  envelopeFrom: string;
} {
  const fromHeader = newsletterFromAddress();
  const envelopeFrom = parseEmailFromEnv(fromHeader).email;
  const domain = envelopeFrom.split("@")[1] || "nsfwdroid.com";
  const messageId = `<${randomUUID()}@${domain}>`;
  const boundary = `nsfwdroid_${randomUUID().replace(/-/g, "")}`;
  const date = new Date().toUTCString().replace("GMT", "+0000");

  const replyTo =
    process.env.NEWSLETTER_REPLY_TO?.trim() ||
    process.env.NEWSLETTER_FROM?.trim() ||
    process.env.ALERT_EMAIL_FROM?.trim() ||
    fromHeader;

  const headers = [
    `From: ${fromHeader}`,
    `To: ${input.to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${encodeHeader(input.subject)}`,
    `Date: ${date}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
  ];
  if (input.listUnsubscribeUrl?.trim()) {
    const url = input.listUnsubscribeUrl.trim();
    headers.push(`List-Unsubscribe: <${url}>`);
    headers.push("List-Unsubscribe-Post: List-Unsubscribe=One-Click");
    headers.push(`List-ID: <weekly.${domain}>`);
    headers.push("Precedence: bulk");
  }
  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

  const text = input.text ?? "";
  const parts = [
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(Buffer.from(text, "utf8").toString("base64")),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(Buffer.from(input.html, "utf8").toString("base64")),
    `--${boundary}--`,
    "",
  ];

  return {
    raw: `${headers.join("\r\n")}\r\n\r\n${parts.join("\r\n")}`,
    messageId,
    envelopeFrom,
  };
}

/** Hand the message to the local MTA. Exim signs DKIM when it delivers. */
export function sendViaSendmail(input: SendmailInput): Promise<SendmailResult> {
  const { raw, messageId, envelopeFrom } = buildNewsletterMime(input);

  return new Promise((resolve) => {
    const child = spawn(SENDMAIL_BIN, ["-t", "-oi", "-f", envelopeFrom], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (err) => {
      resolve({ ok: false, error: `sendmail_spawn:${err.message}` });
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ ok: true, messageId });
        return;
      }
      resolve({
        ok: false,
        error: `sendmail_exit_${code ?? "null"}:${stderr.slice(0, 200)}`,
      });
    });
    child.stdin.end(raw);
  });
}
