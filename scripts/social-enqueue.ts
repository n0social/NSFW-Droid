import "dotenv/config";
import { closeCatalogDb, getDb } from "../src/db";
import { isSocialEnqueueEnabled } from "../src/lib/social/config";
import { enqueueSocialForNewListings } from "../src/lib/social/enqueue";

async function main() {
  if (!isSocialEnqueueEnabled()) {
    console.log(JSON.stringify({ ok: true, skipped: "SOCIAL_ENQUEUE_ENABLED=0" }));
    return;
  }

  const db = await getDb();
  try {
    const result = await enqueueSocialForNewListings(db);
    console.log(JSON.stringify({ ok: true, ...result }));
  } finally {
    await closeCatalogDb();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
