import "dotenv/config";
import { closeCatalogDb, getDb } from "../src/db";
import { socialDrainLimitPerRun } from "../src/lib/social/config";
import { drainSocialOutbox } from "../src/lib/social/drain";
import { appendSocialLog } from "../src/lib/social/log";

async function main() {
  const limit = socialDrainLimitPerRun();
  const db = await getDb();
  try {
    const result = await drainSocialOutbox(db, { limit });
    const payload = { ok: true, ...result };
    appendSocialLog({ event: "drain", ...payload });
    console.log(JSON.stringify(payload));
  } finally {
    await closeCatalogDb();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
