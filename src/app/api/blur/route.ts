import { NextResponse } from "next/server";
import { AGE_VERIFIED_COOKIE, BLUR_COVERS_COOKIE, parseAgeVerified } from "@/lib/cookies";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const jar = await cookies();
  if (!parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value)) {
    return NextResponse.json(
      { ok: false, error: "age_not_verified", blur: true },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const enabled = body?.enabled !== false;

  const res = NextResponse.json({ ok: true, blur: enabled });
  res.cookies.set(BLUR_COVERS_COOKIE, enabled ? "1" : "0", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
