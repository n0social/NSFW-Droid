import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "admin_session";

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;
  const a = createHash("sha256").update(password).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function isAdminSession(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const secret = process.env.ADMIN_PASSWORD;
  if (!token || !secret) return false;
  const expected = createHash("sha256").update(`admin:${secret}`).digest("hex");
  return token === expected;
}

export function adminSessionToken(): string {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(`admin:${secret}`).digest("hex");
}
