import assert from "node:assert/strict";
import {
  buildSocialPostPayload,
  formatMastodonStatus,
  listingGameUrl,
} from "../src/lib/social/compose";
import { resolveListingCoverUrl } from "../src/lib/social/cover-url";

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

assert.equal(
  resolveListingCoverUrl("https://img.itch.zone/a1234.jpg"),
  "https://img.itch.zone/a1234.jpg",
);
assert.equal(
  resolveListingCoverUrl("//cdn.example.com/x.png"),
  "https://cdn.example.com/x.png",
);
assert.equal(
  resolveListingCoverUrl("/covers/foo.webp"),
  "https://www.nsfwdroid.com/covers/foo.webp",
);

console.log(JSON.stringify({ ok: true, sample: status }));
