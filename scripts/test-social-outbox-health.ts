import assert from "node:assert/strict";

async function main() {
  const config = await import("../src/lib/social/config");
  const health = await import("../src/lib/social/outbox-health");
  process.env.HEALTH_SOCIAL_OUTBOX = "1";
  process.env.SOCIAL_MASTODON_ENABLED = "1";
  process.env.MASTODON_INSTANCE_URL = "https://mastodon.example";
  process.env.MASTODON_ACCESS_TOKEN = "token";
  assert.equal(config.socialDrainLimitPerRun(), 10);
  const { getDb, closeCatalogDb } = await import("../src/db");
  const db = await getDb();
  try {
    const snapshot = await health.getSocialHealthSnapshot(db);
    assert.ok(snapshot?.outbox);
  } finally {
    await closeCatalogDb();
  }
  console.log("test-social-outbox-health: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
