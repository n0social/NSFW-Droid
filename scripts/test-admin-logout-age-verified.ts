import assert from "node:assert/strict";

/**
 * Documents admin logout behavior: age_verified is refreshed when the visitor
 * had admin or member session before clearing admin_session.
 */
function shouldRefreshAgeVerified(input: {
  hadAdmin: boolean;
  hadMember: boolean;
}): boolean {
  return input.hadAdmin || input.hadMember;
}

assert.equal(shouldRefreshAgeVerified({ hadAdmin: true, hadMember: false }), true);
assert.equal(shouldRefreshAgeVerified({ hadAdmin: false, hadMember: true }), true);
assert.equal(shouldRefreshAgeVerified({ hadAdmin: false, hadMember: false }), false);

console.log("test-admin-logout-age-verified: ok");
