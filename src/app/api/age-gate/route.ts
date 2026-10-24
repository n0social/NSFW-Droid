import { NextResponse } from "next/server";
import { AGE_VERIFIED_COOKIE, ageVerifiedCookieOptions } from "@/lib/cookies";
import { rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimitExceededResponse(request, "age-gate", 40, 60 * 1000);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const answer = body?.answer;

  if (answer === "no") {
    return NextResponse.json({ ok: true, redirect: "/underage" });
  }

  if (answer !== "yes") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AGE_VERIFIED_COOKIE, "1", ageVerifiedCookieOptions());
  return res;
}
