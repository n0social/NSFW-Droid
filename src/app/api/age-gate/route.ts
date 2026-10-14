import { NextResponse } from "next/server";
import { AGE_VERIFIED_COOKIE, BLUR_COVERS_COOKIE } from "@/lib/cookies";

const MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const answer = body?.answer;

  if (answer === "no") {
    return NextResponse.json({ ok: true, redirect: "/underage" });
  }

  if (answer !== "yes") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AGE_VERIFIED_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  res.cookies.set(BLUR_COVERS_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}
