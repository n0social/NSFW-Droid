import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminSessionToken } from "../src/lib/admin-auth";
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
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !input.adminSession) return false;
  const dot = input.adminSession.indexOf(".");
  if (dot <= 0) return false;
  const id = input.adminSession.slice(0, dot);
  const { createHmac, timingSafeEqual } = require("node:crypto") as typeof import("node:crypto");
  const sig = input.adminSession.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(id).digest("base64url");
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
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

console.log("test-age-verified-admin-session: ok");
