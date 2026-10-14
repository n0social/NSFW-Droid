import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14;

function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET?.trim();
  return secret || null;
}

/** Signed payload: uid.exp (unix seconds). */
export function createSignedSessionValue(uid: string, maxAgeSec = SESSION_MAX_AGE_SEC): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const payload = `${uid}.${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySignedSessionValue(value: string | undefined): string | null {
  if (!value) return null;
  const secret = sessionSecret();
  if (!secret) return null;

  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [uid, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!uid || !Number.isFinite(exp)) return null;
  if (exp < Math.floor(Date.now() / 1000)) return null;

  const payload = `${uid}.${expStr}`;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return uid;
}

export const userSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
  secure: process.env.NODE_ENV === "production",
};
