import assert from "node:assert/strict";
import { isListingSlugSafeForPublicUrl } from "../src/lib/listing-routes";

assert.equal(isListingSlugSafeForPublicUrl("fazbooba-simulator-zbooba-simulator"), true);
assert.equal(isListingSlugSafeForPublicUrl("cherry-vx-free-action-https:"), false);
assert.equal(isListingSlugSafeForPublicUrl("foo-https://"), false);
assert.equal(isListingSlugSafeForPublicUrl("https://evil"), false);

console.log("test-sitemap-slug-safety: ok");
