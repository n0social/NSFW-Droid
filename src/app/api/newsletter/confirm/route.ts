import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { confirmSubscriberByToken } from "@/lib/newsletter/subscriber";
import { newsletterPublicBaseUrl } from "@/lib/newsletter/config";
import { fetchWeeklyNewsletterPicks } from "@/lib/newsletter/picks";
import { sendWeeklyNewsletterToSubscriber } from "@/lib/newsletter/send-weekly-to-subscriber";
import { hashNewsletterToken } from "@/lib/newsletter/tokens";
import { newsletterSubscribers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.redirect(`${newsletterPublicBaseUrl()}/newsletter?error=missing_token`);
  }

  const result = await confirmSubscriberByToken(token);
  const base = newsletterPublicBaseUrl();

  if (result === "invalid") {
    return NextResponse.redirect(`${base}/newsletter?error=invalid_token`);
  }

  if (result === "confirmed" && process.env.RESEND_API_KEY?.trim()) {
    const tokenHash = hashNewsletterToken(token);
    const db = await getDb();
    const [row] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.tokenHash, tokenHash))
      .limit(1);

    if (row) {
      const pickResult = await fetchWeeklyNewsletterPicks(db);
      if (pickResult.picks.length) {
        const send = await sendWeeklyNewsletterToSubscriber(
          { id: row.id, email: row.email },
          pickResult.picks,
        );
        if (!send.ok) {
          console.error("[newsletter/confirm] welcome weekly send failed:", send.error);
        } else {
          console.log(
            `[newsletter/confirm] sent welcome weekly to ${row.email} resendId=${send.resendId}`,
          );
        }
      }
    }
  }

  const status = result === "already_active" ? "already" : "confirmed";
  return NextResponse.redirect(`${base}/newsletter?status=${status}`);
}
