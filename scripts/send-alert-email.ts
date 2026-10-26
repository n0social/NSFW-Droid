import "dotenv/config";
import { spawn } from "node:child_process";
import { parseEmailFromEnv } from "../src/lib/newsletter/config";
import { sendViaSendmail } from "../src/lib/newsletter/send-email";

function parseArgs(): { to: string; subject: string; body: string } {
  const args = process.argv.slice(2);
  let to = "";
  let subject = "";
  let body = "";
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--to") to = args[++i] ?? "";
    else if (a === "--subject") subject = args[++i] ?? "";
    else if (a === "--body") body = args[++i] ?? "";
  }
  if (!to || !subject) {
    console.error("Usage: send-alert-email.ts --to ADDR --subject TEXT --body TEXT");
    process.exit(2);
  }
  return { to, subject, body: body || subject };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function alertFromHeader(): string {
  const raw =
    process.env.ALERT_EMAIL_FROM?.trim() ||
    process.env.NEWSLETTER_FROM?.trim() ||
    "alerts@nsfwdroid.com";
  const parsed = parseEmailFromEnv(raw);
  const name = process.env.NEWSLETTER_FROM_NAME?.trim() || "NSFW Droid";
  if (parsed.displayName) return raw;
  return `"${name}" <${parsed.email}>`;
}

async function sendViaSmtpCurl(
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS ?? "";
  if (!host || !user) {
    throw new Error("SMTP_HOST and SMTP_USER required for ALERT_EMAIL_TRANSPORT=smtp");
  }
  const port = process.env.SMTP_PORT?.trim() || "587";
  const from = alertFromHeader();
  const url = `smtp://${host}:${port}`;
  const payload = `From: ${from}\r\nTo: ${to}\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nAuto-Submitted: auto-generated\r\n\r\n${body.replace(/\n/g, "\r\n")}\r\n`;

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      "curl",
      [
        "-sf",
        "--max-time",
        "45",
        "--mail-from",
        parseEmailFromEnv(from).email,
        "--mail-rcpt",
        to,
        "--url",
        url,
        "--ssl-reqd",
        "--user",
        `${user}:${pass}`,
        "-T",
        "-",
      ],
      { stdio: ["pipe", "ignore", "pipe"] },
    );
    let err = "";
    child.stderr.on("data", (c) => {
      err += String(c);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err || `curl smtp exit ${code}`));
    });
    child.stdin.write(payload);
    child.stdin.end();
  });
}

async function main() {
  const { to, subject, body } = parseArgs();
  const transport = (process.env.ALERT_EMAIL_TRANSPORT ?? "sendmail").trim().toLowerCase();
  const text = body.replace(/\r\n/g, "\n");
  const html = `<!DOCTYPE html><html><body><pre style="font-family:ui-monospace,monospace;font-size:13px;line-height:1.45">${escapeHtml(text)}</pre></body></html>`;

  if (transport === "smtp") {
    await sendViaSmtpCurl(to, subject, text);
    console.log("[send-alert-email] smtp ok");
    return;
  }

  if (transport === "brevo") {
    console.error(
      "[send-alert-email] ALERT_EMAIL_TRANSPORT=brevo is not used on this project; use sendmail (Exim) or smtp",
    );
    process.exit(1);
  }

  const result = await sendViaSendmail({
    to,
    subject,
    text,
    html,
    from: alertFromHeader(),
  });
  if (!result.ok) {
    console.error(`[send-alert-email] sendmail failed: ${result.error}`);
    process.exit(1);
  }
  console.log("[send-alert-email] sendmail ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
