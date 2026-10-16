import { NextResponse } from "next/server";
import { confirmSubscriberByToken } from "@/lib/newsletter/subscriber";
import { newsletterPublicBaseUrl } from "@/lib/newsletter/config";

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

  const status = result === "already_active" ? "already" : "confirmed";
  return NextResponse.redirect(`${base}/newsletter?status=${status}`);
}
