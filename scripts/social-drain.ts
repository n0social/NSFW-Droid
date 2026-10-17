import "dotenv/config";
import { closeCatalogDb, getDb } from "../src/db";
import { drainSocialOutbox } from "../src/lib/social/drain";

async function main() {
  const limit = Number(process.env.SOCIAL_DRAIN_LIMIT ?? "10");
  const db = await getDb();
  try {
    const result = await drainSocialOutbox(db, {
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    });
    console.log(JSON.stringify({ ok: true, ...result }));
  } finally {
    await closeCatalogDb();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
