import assert from "node:assert/strict";
import {
  isRetryableMastodonMediaError,
  shouldPostWithoutCoverOnError,
} from "../src/lib/social/mastodon";

assert.equal(isRetryableMastodonMediaError("mastodon_media_503:<html>"), true);
assert.equal(isRetryableMastodonMediaError("mastodon_media_429:rate"), true);
assert.equal(isRetryableMastodonMediaError("mastodon_media_401:bad token"), false);
assert.equal(isRetryableMastodonMediaError("cover_fetch_failed:404"), false);

assert.equal(shouldPostWithoutCoverOnError("cover_fetch_blocked:private_ip"), true);
assert.equal(shouldPostWithoutCoverOnError("mastodon_media_503:down"), false);

console.log("test-mastodon-cover-retry: ok");
