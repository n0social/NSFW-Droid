/**
 * Weekly top-6 listings for the member newsletter (Phase 1).
 * Outputs JSON: { windowDays, filteredCount, picks: [...] }
 * Eligibility: published, link ok, no TOS hold/review block, no blocked tags, no offensive titles.
 *
 * Usage: tsx scripts/weekly-newsletter-pick.ts
 */
import "dotenv/config";
import { closeCatalogDb, getDb } from "../src/db";
import { fetchWeeklyNewsletterPicks } from "../src/lib/newsletter/picks";

async function main() {
  const db = await getDb();
  const result = await fetchWeeklyNewsletterPicks(db);
  console.log(JSON.stringify(result, null, 2));
  await closeCatalogDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
