import assert from "node:assert/strict";
import { createAdminSessionToken, verifyAdminSessionToken } from "../src/lib/admin-auth";
import { verifySignedSessionValue } from "../src/lib/session-cookie";
import { effectiveCoverBlur } from "../src/lib/cover-blur";
import { parseAgeVerified } from "../src/lib/cookies";

process.env.ADMIN_PASSWORD = "test-age-verified-admin";

const adminToken = createAdminSessionToken();
assert.ok(adminToken, "admin session token mints when ADMIN_PASSWORD is set");

/** Mirrors isAgeVerifiedRequest() without Next cookies(). */
function ageVerifiedForCookies(input: {
  ageCookie?: string;
  userSession?: string;
  adminSession?: string;
}): boolean {
  if (parseAgeVerified(input.ageCookie)) return true;
  if (verifySignedSessionValue(input.userSession)) return true;
  if (!input.adminSession) return false;
  return verifyAdminSessionToken(input.adminSession);
}

assert.equal(ageVerifiedForCookies({}), false, "no cookies → not verified");
assert.equal(
  ageVerifiedForCookies({ adminSession: adminToken }),
  true,
  "valid admin_session counts as age verified for SSR blur",
);
assert.equal(
  effectiveCoverBlur(ageVerifiedForCookies({ adminSession: adminToken }), false),
  false,
  "admin session → unblurred covers when blur preference off",
);
assert.equal(
  effectiveCoverBlur(ageVerifiedForCookies({ ageCookie: "1" }), false),
  false,
  "age_verified cookie alone → clear covers",
);

process.env.ADMIN_SESSION_SECRET = "dedicated-signing-key";
const dedicatedToken = createAdminSessionToken();
assert.ok(dedicatedToken, "token mints when only ADMIN_SESSION_SECRET is set");
delete process.env.ADMIN_PASSWORD;
assert.equal(
  verifyAdminSessionToken(dedicatedToken),
  true,
  "session verifies with ADMIN_SESSION_SECRET after ADMIN_PASSWORD removed",
);

console.log("test-age-verified-admin-session: ok");
