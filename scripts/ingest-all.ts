import "dotenv/config";
import { sql } from "drizzle-orm";
import { autoPublishPendingCandidates } from "../src/lib/auto-publish";
import { recordIngestRun } from "../src/lib/ingest-run";
import { runItchIngest } from "./ingest-itch";
import { runSteamIngest } from "./ingest-steam";
import { runAffiliateIngest } from "./ingest-affiliate";
import { closeCatalogDb, getDb } from "../src/db";
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
  const startedAt = new Date();
  const db = await getDb();
  try {
    const itch = await runItchIngest();
    const steam = await runSteamIngest();
    const affiliate = await runAffiliateIngest();
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
        (SELECT count(*)::int FROM candidate WHERE review_status = 'pending') AS pending,
        (SELECT count(*)::int FROM listing WHERE affiliate_url IS NOT NULL AND trim(affiliate_url) <> '') AS listings_with_affiliate
    `);

    const summary = {
      itch,
      steam,
      affiliate,
      tagsBackfilled,
      listingTagsLinked,
      autoPublished,
      catalog: counts.rows[0],
    };

    console.log(JSON.stringify(summary));

    await recordIngestRun({
      job: "ingest_all",
      status: "ok",
      startedAt,
      summary: summary as Record<string, unknown>,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordIngestRun({
      job: "ingest_all",
      status: "error",
      startedAt,
      errorMessage: message,
    });
    throw err;
  } finally {
    await closeCatalogDb();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
