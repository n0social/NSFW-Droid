import { newsletterFromAddress } from "@/lib/newsletter/config";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendResendEmail(input: SendEmailInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "missing_resend_api_key" };
  }

  const from = newsletterFromAddress();

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
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `resend_http_${res.status}:${body.slice(0, 200)}` };
  }

  return { ok: true };
}
