import { cookies } from "next/headers";
import { verifySignedSessionValue } from "@/lib/session-cookie";

/** httpOnly session set by POST /api/auth/session after Firebase ID token verification. */
export const USER_SESSION_COOKIE = "USER_SESSION";

/**
 * Server-side signed-in check (SSR, ThemeProvider holiday opt-out).
 * Requires SESSION_SECRET + successful session exchange with Firebase Admin.
 */
export async function isSignedIn(): Promise<boolean> {
  const jar = await cookies();
  const uid = verifySignedSessionValue(jar.get(USER_SESSION_COOKIE)?.value);
  return uid !== null;
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  return verifySignedSessionValue(jar.get(USER_SESSION_COOKIE)?.value);
}
