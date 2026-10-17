import assert from "node:assert/strict";
import {
  DEFAULT_DISPLAY_NAME,
  DEFAULT_NOTE,
  DEFAULT_WEBSITE,
} from "./mastodon-update-profile";

assert.equal(DEFAULT_DISPLAY_NAME, "NSFW Droid");
assert.equal(DEFAULT_WEBSITE, "https://www.nsfwdroid.com");
assert.ok(DEFAULT_NOTE.length <= 500, `note ${DEFAULT_NOTE.length} > 500`);
assert.ok(DEFAULT_NOTE.includes("Top NSFW mobile & web games listing"));
assert.ok(DEFAULT_NOTE.includes("weekly newsletter"));
assert.ok(DEFAULT_NOTE.includes("18+"));
assert.ok(DEFAULT_NOTE.includes(DEFAULT_WEBSITE));

console.log(JSON.stringify({ ok: true, note_len: DEFAULT_NOTE.length }));
