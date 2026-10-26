import "dotenv/config";
import { spawn } from "node:child_process";
import { sendBrevoEmail } from "../src/lib/newsletter/brevo";
import { buildSendmailMessage } from "../src/lib/newsletter/send-email";

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

function sendmailBinary(): string {
  if (process.env.SENDMAIL_PATH?.trim()) return process.env.SENDMAIL_PATH.trim();
  return "/usr/sbin/sendmail";
}

async function sendViaSendmail(to: string, subject: string, body: string): Promise<void> {
  const text = body.replace(/\r\n/g, "\n");
  const html = `<!DOCTYPE html><html><body><pre style="font-family:ui-monospace,monospace;font-size:13px;line-height:1.45">${escapeHtml(text)}</pre></body></html>`;
  const message = buildSendmailMessage({
    to,
    subject,
    text,
    html,
  });
  const bin = sendmailBinary();
  await new Promise<void>((resolve, reject) => {
    const child = spawn(bin, ["-t", "-oi"], { stdio: ["pipe", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (c) => {
      err += String(c);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err || `sendmail exit ${code}`));
    });
    child.stdin.write(message);
    child.stdin.end();
  });
}

async function main() {
  const { to, subject, body } = parseArgs();
  const transport = (process.env.ALERT_EMAIL_TRANSPORT ?? "sendmail").trim().toLowerCase();
  const preferBrevo =
    transport === "brevo" || (transport !== "sendmail" && Boolean(process.env.BREVO_API_KEY?.trim()));

  if (preferBrevo && process.env.BREVO_API_KEY?.trim()) {
    const text = body.replace(/\r\n/g, "\n");
    const html = `<p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5">${escapeHtml(text).replace(/\n/g, "<br/>")}</p>`;
    const res = await sendBrevoEmail({ to, subject, text, html });
    if (res.ok) {
      console.log(`[send-alert-email] brevo messageId=${res.messageId}`);
      return;
    }
    console.error(`[send-alert-email] brevo failed: ${res.error}; falling back to sendmail`);
  }

  await sendViaSendmail(to, subject, body);
  console.log("[send-alert-email] sendmail ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
