import { NextResponse } from "next/server";
import { THEME_OVERRIDE_COOKIE, themeCookieOptions } from "@/lib/themes/preferences";
import type { ThemeOverridePreference } from "@/lib/themes/types";

const VALID: ThemeOverridePreference[] = ["default", "auto"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const preference = body?.preference as ThemeOverridePreference | undefined;

  if (!preference || !VALID.includes(preference)) {
    return NextResponse.json(
      { ok: false, error: "invalid_preference", allowed: VALID },
      { status: 400 },
    );
  }

  const res = NextResponse.json({ ok: true, preference });
  if (preference === "auto") {
    res.cookies.set(THEME_OVERRIDE_COOKIE, "", { ...themeCookieOptions, maxAge: 0 });
  } else {
    res.cookies.set(THEME_OVERRIDE_COOKIE, preference, themeCookieOptions);
  }
  return res;
}
