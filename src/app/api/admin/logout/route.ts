import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminCookieOptions, isAdminSession } from "@/lib/admin-auth";
import { AGE_VERIFIED_COOKIE, ageVerifiedCookieOptions } from "@/lib/cookies";
import { verifySignedSessionValue } from "@/lib/session-cookie";
import { USER_SESSION_COOKIE } from "@/lib/user-session";

export async function POST() {
  const hadAdminSession = await isAdminSession();
  const jar = await cookies();
  const hadMemberSession = verifySignedSessionValue(jar.get(USER_SESSION_COOKIE)?.value) !== null;

  const res = NextResponse.json({ ok: true });
  const opts = adminCookieOptions();
  res.cookies.set(ADMIN_COOKIE, "", { ...opts, maxAge: 0 });

  // Browsing the catalog as admin implies 18+; keep storefront unblurred after sign-out.
  if (hadAdminSession || hadMemberSession) {
    res.cookies.set(AGE_VERIFIED_COOKIE, "1", ageVerifiedCookieOptions());
  }

  return res;
}
