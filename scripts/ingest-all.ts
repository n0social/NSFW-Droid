import "dotenv/config";
import { sql } from "drizzle-orm";
import { autoPublishPendingCandidates } from "../src/lib/auto-publish";
import { runItchIngest } from "./ingest-itch";
import { runSteamIngest } from "./ingest-steam";
import { db } from "../src/db";
import { candidates } from "../src/db/schema";
import {
  backfillCandidateTags,
  backfillListingTagsFromCandidates,
} from "../src/lib/catalog-tags";
import { extractItchItemTags, extractSteamTags } from "./lib/tag-extract";

function deriveTags(c: typeof candidates.$inferSelect) {
  const raw = c.rawPayload as Record<string, unknown> | null;
  if (!raw) return [];
  if (c.source === "itch") {
    return extractItchItemTags(raw, String(raw.feedUrl ?? ""));
  }
  if (c.source === "steam") {
    const steam = (raw.steam ?? raw) as Parameters<typeof extractSteamTags>[0];
    return extractSteamTags(steam);
  }
  return [];
}

async function main() {
  const itch = await runItchIngest();
  const steam = await runSteamIngest();
  const tagsBackfilled = await backfillCandidateTags(deriveTags);
  const listingTagsLinked = await backfillListingTagsFromCandidates();
  const autoPublished = await autoPublishPendingCandidates(
    Number(process.env.INGEST_AUTO_PUBLISH_LIMIT ?? "500"),
  );

  const counts = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM candidate) AS candidates,
      (SELECT count(*)::int FROM listing) AS listings,
      (SELECT count(*)::int FROM tag) AS tags,
      (SELECT count(*)::int FROM candidate WHERE review_status = 'pending') AS pending
  `);

  console.log(
    JSON.stringify({
      itch,
      steam,
      tagsBackfilled,
      listingTagsLinked,
      autoPublished,
      catalog: counts.rows[0],
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
