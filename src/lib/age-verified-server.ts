import { cookies } from "next/headers";
import { isAdminSession } from "@/lib/admin-auth";
import { AGE_VERIFIED_COOKIE, parseAgeVerified } from "@/lib/cookies";
import { verifySignedSessionValue } from "@/lib/session-cookie";
import { USER_SESSION_COOKIE } from "@/lib/user-session";

/**
 * Whether the visitor may see unblurred catalog content.
 * True after the age gate, a valid member session (Firebase → USER_SESSION), or admin login.
 */
export async function isAgeVerifiedRequest(): Promise<boolean> {
  const jar = await cookies();
  if (parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value)) {
    return true;
  }
  if (verifySignedSessionValue(jar.get(USER_SESSION_COOKIE)?.value)) {
    return true;
  }
  return await isAdminSession();
}
