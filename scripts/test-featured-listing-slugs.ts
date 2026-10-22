import assert from "node:assert/strict";
import {
  featuredListingSlugsFromData,
  featuredListingSlugsFromEnv,
} from "../src/lib/featured-listings";

const data = featuredListingSlugsFromData();
assert.ok(data.length >= 1, "featured-listing-slugs.json should list at least one slug");
assert.ok(
  !data.includes("corruption-of-champions-2-orruption-of-champions-2"),
  "CoC2 should not be default featured hero",
);
assert.equal(featuredListingSlugsFromEnv().length, 0);

console.log("test-featured-listing-slugs: ok", data[0]);
