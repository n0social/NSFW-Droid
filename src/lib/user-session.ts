import { cookies } from "next/headers";

/** Stub cookie until player accounts ship. */
export const USER_SESSION_COOKIE = "USER_SESSION";

/**
 * Returns true when a real session exists.
 * Today always false unless USER_SESSION=1 is set manually for testing.
 */
export async function isSignedIn(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(USER_SESSION_COOKIE)?.value === "1";
}
