import assert from "node:assert/strict";
import { featuredListingSlugsFromEnv } from "../src/lib/featured-listings";

assert.equal(featuredListingSlugsFromEnv().length, 0);

process.env.FEATURED_LISTING_SLUGS = "foo-bar, baz";
assert.deepEqual(featuredListingSlugsFromEnv(), ["foo-bar", "baz"]);

console.log("test-featured-hero-env: ok");
