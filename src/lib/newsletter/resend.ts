import { newsletterFromAddress } from "@/lib/newsletter/config";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** RFC 2369 one-click unsubscribe URL (improves inbox placement). */
  listUnsubscribeUrl?: string;
};

export type SendResendEmailResult =
  | { ok: true; resendId: string }
  | { ok: false; error: string };

export async function sendResendEmail(
  input: SendEmailInput,
): Promise<SendResendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "missing_resend_api_key" };
  }

  const from = newsletterFromAddress();

  const headers: Record<string, string> = {};
  if (input.listUnsubscribeUrl?.trim()) {
    const url = input.listUnsubscribeUrl.trim();
    headers["List-Unsubscribe"] = `<${url}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(Object.keys(headers).length ? { headers } : {}),
    }),
  });

  const bodyText = await res.text().catch(() => "");

  if (!res.ok) {
    return { ok: false, error: `resend_http_${res.status}:${bodyText.slice(0, 200)}` };
  }

  let parsed: { id?: string; message?: string; name?: string } | null = null;
  try {
    parsed = bodyText ? (JSON.parse(bodyText) as { id?: string; message?: string; name?: string }) : null;
  } catch {
    parsed = null;
  }

  const resendId = parsed?.id?.trim();
  if (!resendId) {
    return {
      ok: false,
      error: `resend_missing_id:${bodyText.slice(0, 200) || "empty_body"}`,
    };
  }

  return { ok: true, resendId };
}
