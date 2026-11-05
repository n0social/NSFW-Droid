import assert from "node:assert/strict";
import {
  SIGNUP_PASSWORD_RULE,
  signupPasswordMeetsPolicy,
  signupPasswordPolicyMessage,
} from "../src/lib/password-policy";

assert.equal(
  SIGNUP_PASSWORD_RULE,
  "At least 10 characters, including one letter and one number.",
);

assert.equal(signupPasswordMeetsPolicy("short1"), false);
assert.equal(signupPasswordMeetsPolicy("abcdefghi"), false);
assert.equal(signupPasswordMeetsPolicy("1234567890"), false);
assert.equal(signupPasswordMeetsPolicy("abcdefghij"), false);
assert.equal(signupPasswordMeetsPolicy("abcdefghi1"), true);
assert.equal(signupPasswordMeetsPolicy("Abcdefgh12"), true);
assert.equal(signupPasswordMeetsPolicy("!!!!!!!!1a"), true);
assert.equal(signupPasswordMeetsPolicy("密码密码密码密码12"), true);

assert.equal(signupPasswordPolicyMessage("password"), SIGNUP_PASSWORD_RULE);
assert.equal(signupPasswordPolicyMessage("abcdefghi1"), null);

console.log("test-password-policy: ok");
