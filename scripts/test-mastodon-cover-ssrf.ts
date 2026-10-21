import assert from "node:assert/strict";
import { uploadMastodonMedia } from "../src/lib/social/mastodon";

async function expectBlocked(url: string) {
  await assert.rejects(
    () => uploadMastodonMedia(url),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /cover_fetch_blocked/);
      return true;
    },
  );
}

async function main() {
  await expectBlocked("http://127.0.0.1/cover.jpg");
  await expectBlocked("http://169.254.169.254/latest/meta-data/");
  await expectBlocked("http://metadata.google.internal/x");
  console.log("test-mastodon-cover-ssrf: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
