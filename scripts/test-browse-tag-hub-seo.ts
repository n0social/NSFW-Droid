import assert from "node:assert/strict";
import { browseTagHubIntro } from "../src/lib/browse-tag-intro";
import { isNsfwBrowseCatalogTag } from "../src/lib/tag-filter";

assert.match(
  browseTagHubIntro("Visual Novel", 12),
  /12 catalog titles tagged “Visual Novel”/,
);
assert.match(browseTagHubIntro("Solo", 1), /1 catalog title tagged “Solo”/);
assert.match(browseTagHubIntro("Empty", 0), /No catalog titles tagged “Empty”/);

assert.equal(isNsfwBrowseCatalogTag({ slug: "single-player", label: "Single-player", kind: "genre" }), false);
assert.equal(isNsfwBrowseCatalogTag({ slug: "visual-novel", label: "Visual Novel", kind: "genre" }), true);

const sampleUrl = `/browse?tag=${encodeURIComponent("visual-novel")}`;
assert.equal(sampleUrl, "/browse?tag=visual-novel");

console.log("ok (browse tag hub intro + sitemap filter smoke)");
