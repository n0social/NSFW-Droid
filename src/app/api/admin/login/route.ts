import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`admin-login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  if (!verifyAdminPassword(String(body.password ?? ""))) {
    await logAdminAction({ action: "login_failed", ip, metadata: {} }).catch(() => {});
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = createAdminSessionToken();
  if (!token) {
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }

  await logAdminAction({ action: "login_success", ip }).catch(() => {});

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return res;
}
