import assert from "node:assert/strict";
import {
  featuredListingEnvOverrideActive,
  featuredListingOverrideEndsAt,
  featuredListingSlugsFromEnv,
  nextWeeklyFeaturedRotationAt,
  resetFeaturedOverrideCacheForTests,
} from "../src/lib/featured-override";

resetFeaturedOverrideCacheForTests();
delete process.env.FEATURED_LISTING_SLUGS;
delete process.env.FEATURED_LISTING_SLUGS_UNTIL;
assert.equal(featuredListingEnvOverrideActive(), false);

process.env.FEATURED_LISTING_SLUGS = "fazbooba-simulator-zbooba-simulator";
assert.equal(featuredListingEnvOverrideActive(), true);

resetFeaturedOverrideCacheForTests();
process.env.FEATURED_LISTING_SLUGS_UNTIL = "auto";
const sat = new Date("2026-10-24T16:00:00-04:00");
const ends = featuredListingOverrideEndsAt(sat);
assert.ok(ends);
assert.equal(ends!.getTime(), nextWeeklyFeaturedRotationAt(sat).getTime());
assert.equal(featuredListingEnvOverrideActive(sat), true);

const afterRotation = new Date(ends!.getTime() + 1000);
assert.equal(featuredListingEnvOverrideActive(afterRotation), false);

process.env.FEATURED_LISTING_SLUGS_UNTIL = "2026-10-27";
const endsYmd = featuredListingOverrideEndsAt(sat);
assert.ok(endsYmd);
assert.equal(featuredListingEnvOverrideActive(sat), true);

delete process.env.FEATURED_LISTING_SLUGS_UNTIL;
assert.deepEqual(featuredListingSlugsFromEnv(), ["fazbooba-simulator-zbooba-simulator"]);
assert.equal(featuredListingEnvOverrideActive(sat), true);

console.log("test-featured-override: ok", { ends: ends?.toISOString() });
