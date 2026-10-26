import assert from "node:assert/strict";
import { browseCatalogPath } from "../src/lib/browse-catalog-path";
import {
  browsePlatformHubIntro,
  normalizeBrowsePlatformSlug,
} from "../src/lib/browse-platforms";
import { browseCatalogDefaultIntro } from "../src/lib/browse-catalog-intro";

assert.equal(browseCatalogPath({ platform: "android" }), "/browse?platform=android");
assert.equal(normalizeBrowsePlatformSlug("macos"), "mac");
assert.equal(normalizeBrowsePlatformSlug("nope"), null);
assert.match(browsePlatformHubIntro("Android", "android", 5), /5 mature games/);
assert.match(browsePlatformHubIntro("Android", "android", 5), /for Android/);
assert.match(browseCatalogDefaultIntro(), /Android/);

console.log("test-browse-platform-hub: ok");
