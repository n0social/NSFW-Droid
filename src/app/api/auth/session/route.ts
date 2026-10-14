import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  createSignedSessionValue,
  userSessionCookieOptions,
  verifySignedSessionValue,
} from "@/lib/session-cookie";
import { USER_SESSION_COOKIE } from "@/lib/user-session";

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "server_auth_not_configured" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const idToken = String(body.idToken ?? "");
  if (!idToken) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  const adminAuth = getFirebaseAdminAuth();
  if (!adminAuth) {
    return NextResponse.json(
      { ok: false, error: "server_auth_not_configured" },
      { status: 503 },
    );
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  const sessionValue = createSignedSessionValue(uid);
  if (!sessionValue) {
    return NextResponse.json({ ok: false, error: "session_secret_missing" }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_SESSION_COOKIE, sessionValue, userSessionCookieOptions);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_SESSION_COOKIE, "", { ...userSessionCookieOptions, maxAge: 0 });
  return res;
}

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${USER_SESSION_COOKIE}=([^;]+)`));
  const uid = verifySignedSessionValue(match?.[1]);
  return NextResponse.json({ signedIn: uid !== null, uid });
}
