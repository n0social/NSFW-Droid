import assert from "node:assert/strict";
import {
  buildSocialPostPayload,
  formatMastodonStatus,
  listingGameUrl,
} from "../src/lib/social/compose";

process.env.NEXT_PUBLIC_SITE_URL = "https://www.nsfwdroid.com";

const payload = buildSocialPostPayload({
  title: "Demo Visual Novel",
  slug: "demo-vn",
  coverImageUrl: null,
  affiliateUrl: "https://example.com/aff",
});

assert.equal(listingGameUrl("demo-vn"), "https://www.nsfwdroid.com/game/demo-vn");
assert.equal(payload.url, listingGameUrl("demo-vn"));

const status = formatMastodonStatus(payload);
assert.ok(status.includes("Demo Visual Novel"));
assert.ok(status.includes("https://www.nsfwdroid.com/game/demo-vn"));
assert.ok(status.includes("Affiliate"));
assert.ok(status.includes("#nsfwgames"));
assert.ok(status.includes("#visualnovel"));

console.log(JSON.stringify({ ok: true, sample: status }));
