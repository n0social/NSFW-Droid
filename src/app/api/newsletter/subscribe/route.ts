import { NextResponse } from "next/server";
import { rejectCrossSitePublicPost } from "@/lib/public-post-csrf";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { newsletterPublicBaseUrl } from "@/lib/newsletter/config";
import { sendBrevoEmail } from "@/lib/newsletter/brevo";
import { renderConfirmSubscriptionHtml } from "@/lib/newsletter/weekly-email";
import { upsertPendingSubscriber } from "@/lib/newsletter/subscriber";
import { isValidSubscriberEmail, normalizeSubscriberEmail } from "@/lib/newsletter/tokens";

const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const csrf = rejectCrossSitePublicPost(request);
  if (csrf) return csrf;

  const ip = clientIp(request);
  if (!rateLimit(`newsletter-subscribe:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.email) {
    return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
  }

  if (body.website && String(body.website).trim()) {
    return NextResponse.json({
      ok: true,
      message: "Check your inbox to confirm your subscription.",
    });
  }

  const email = normalizeSubscriberEmail(String(body.email));
  if (!isValidSubscriberEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const { token, email: normalized } = await upsertPendingSubscriber(email, "footer");
  if (!token) {
    return NextResponse.json({
      ok: true,
      alreadySubscribed: true,
      message: "You're already on the list.",
    });
  }

  const base = newsletterPublicBaseUrl();
  const confirmUrl = `${base}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

  const send = await sendBrevoEmail({
    to: normalized,
    subject: "Confirm your NSFW Droid weekly games list",
    html: renderConfirmSubscriptionHtml({ confirmUrl }),
    text: `Confirm your subscription (18+): ${confirmUrl}`,
  });

  if (!send.ok) {
    console.error("[newsletter/subscribe] send failed:", send.error);
    return NextResponse.json({ ok: false, error: "email_send_failed" }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    message: "Check your inbox to confirm your subscription.",
  });
}
