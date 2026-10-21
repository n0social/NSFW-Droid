import { NextResponse } from "next/server";
import { AGE_VERIFIED_COOKIE, ageVerifiedCookieOptions } from "@/lib/cookies";
import { VESPER_WELCOME_STORAGE_KEY } from "@/lib/welcome-card";
import { isSignedIn } from "@/lib/user-session";

/** Signed-in only: clear age gate cookie so the visitor sees the age verification flow again. */
export async function POST() {
  if (!(await isSignedIn())) {
    return NextResponse.json({ ok: false, error: "sign_in_required" }, { status: 401 });
  }

  const res = NextResponse.json({
    ok: true,
    welcomeStorageKey: VESPER_WELCOME_STORAGE_KEY,
  });
  const opts = ageVerifiedCookieOptions();
  res.cookies.set(AGE_VERIFIED_COOKIE, "", { ...opts, maxAge: 0 });
  return res;
}
