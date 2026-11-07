import assert from "node:assert/strict";
import { ageWallAction } from "../src/lib/age-gate-access";

const base = {
  pathname: "/",
  onAdminHost: false,
  ageVerifiedCookie: undefined,
  userSessionCookie: undefined,
  adminSessionCookie: undefined,
  userAgent: "Mozilla/5.0",
};

assert.equal(ageWallAction(base), "rewrite");
assert.equal(ageWallAction({ ...base, pathname: "/game/example" }), "rewrite");
assert.equal(ageWallAction({ ...base, pathname: "/api/go/abc" }), "deny-api");
assert.equal(ageWallAction({ ...base, ageVerifiedCookie: "1" }), "allow");
assert.equal(ageWallAction({ ...base, pathname: "/terms" }), "allow");
assert.equal(ageWallAction({ ...base, pathname: "/api/age-gate" }), "allow");
assert.equal(ageWallAction({ ...base, pathname: "/api/health" }), "allow");
assert.equal(ageWallAction({ ...base, onAdminHost: true, pathname: "/admin" }), "allow");
assert.equal(
  ageWallAction({ ...base, userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }),
  "allow",
);
assert.equal(ageWallAction({ ...base, userAgent: "curl/8.0" }), "rewrite");

console.log("test-age-gate-wall: ok");
