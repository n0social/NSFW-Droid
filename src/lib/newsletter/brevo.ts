import {
  newsletterFromAddress,
  parseEmailFromEnv,
} from "@/lib/newsletter/config";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** RFC 2369 one-click unsubscribe URL (improves inbox placement). */
  listUnsubscribeUrl?: string;
};

export type SendBrevoEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function senderFromFromHeader(fromHeader: string): { name?: string; email: string } {
  const parsed = parseEmailFromEnv(fromHeader);
  return {
    email: parsed.email,
    ...(parsed.displayName ? { name: parsed.displayName } : {}),
  };
}

export async function sendBrevoEmail(
  input: SendEmailInput,
): Promise<SendBrevoEmailResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "missing_brevo_api_key" };
  }

  const fromHeader = newsletterFromAddress();
  const sender = senderFromFromHeader(fromHeader);

  const headers: Record<string, string> = {};
  if (input.listUnsubscribeUrl?.trim()) {
    const url = input.listUnsubscribeUrl.trim();
    headers["List-Unsubscribe"] = `<${url}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const body: Record<string, unknown> = {
    sender,
    to: [{ email: input.to }],
    subject: input.subject,
    htmlContent: input.html,
    ...(input.text ? { textContent: input.text } : {}),
    ...(Object.keys(headers).length ? { headers } : {}),
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const bodyText = await res.text().catch(() => "");

  if (!res.ok) {
    return {
      ok: false,
      error: `brevo_http_${res.status}:${bodyText.slice(0, 200)}`,
    };
  }

  let parsed: { messageId?: string } | null = null;
  try {
    parsed = bodyText
      ? (JSON.parse(bodyText) as { messageId?: string })
      : null;
  } catch {
    parsed = null;
  }

  const messageId = parsed?.messageId?.trim();
  if (!messageId) {
    return {
      ok: false,
      error: `brevo_missing_message_id:${bodyText.slice(0, 200) || "empty_body"}`,
    };
  }

  return { ok: true, messageId };
}

/** @deprecated Use sendBrevoEmail — kept for callers migrating from Resend naming. */
export const sendHtmlEmail = sendBrevoEmail;
