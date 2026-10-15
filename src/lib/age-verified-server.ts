import { cookies } from "next/headers";
import { AGE_VERIFIED_COOKIE, parseAgeVerified } from "@/lib/cookies";

export async function isAgeVerifiedRequest(): Promise<boolean> {
  const jar = await cookies();
  return parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value);
}
