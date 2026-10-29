import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "admin_session";

const SESSION_HOURS = 8;

/**
 * HMAC key for `admin_session` cookies. Prefer `ADMIN_SESSION_SECRET` so password
 * rotation does not invalidate active sessions. Until it is set, falls back to
 * `ADMIN_PASSWORD` (legacy deployments).
 */
export function adminSessionSigningSecret(): string | null {
  const dedicated = process.env.ADMIN_SESSION_SECRET?.trim();
  if (dedicated) return dedicated;
  const legacy = process.env.ADMIN_PASSWORD?.trim();
  return legacy || null;
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;
  const a = createHash("sha256").update(password).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function createAdminSessionToken(): string {
  const secret = adminSessionSigningSecret();
  if (!secret) return "";
  const id = randomBytes(24).toString("base64url");
  const sig = createHmac("sha256", secret).update(id).digest("base64url");
  return `${id}.${sig}`;
}

export function verifyAdminSessionToken(token: string): boolean {
  const secret = adminSessionSigningSecret();
  if (!secret || !token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(id).digest("base64url");
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isAdminSession(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token ?? "");
}

export function adminCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
    maxAge: 60 * 60 * SESSION_HOURS,
  };
}
