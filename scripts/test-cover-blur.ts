import assert from "node:assert/strict";
import { effectiveCoverBlur } from "../src/lib/cover-blur";
import { parseBlurCovers } from "../src/lib/cookies";

assert.equal(effectiveCoverBlur(false, false), true);
assert.equal(effectiveCoverBlur(false, true), true);
assert.equal(effectiveCoverBlur(true, false), false);
assert.equal(effectiveCoverBlur(true, true), true);

assert.equal(parseBlurCovers(undefined), false);
assert.equal(parseBlurCovers(""), false);
assert.equal(parseBlurCovers("0"), false);
assert.equal(parseBlurCovers("1"), true);

assert.equal(
  effectiveCoverBlur(true, parseBlurCovers(undefined)),
  false,
  "verified + no blur cookie → clear covers",
);

console.log("test-cover-blur: ok");
