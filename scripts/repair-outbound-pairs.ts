/**
 * Clear affiliate_url when it does not pair with official_url (wrong-game redirects).
 * Dry-run by default; pass --apply to persist.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";
import { listings } from "../src/db/schema";
import { outboundPairMismatch } from "../src/lib/outbound-link";
import { resolveListingAffiliateUrl } from "../src/lib/listing-affiliate";

async function main() {
  const apply = process.argv.includes("--apply");
  const db = await getDb();
  const rows = await db.select().from(listings);

  const mismatches = rows.map((r) => outboundPairMismatch(r)).filter(Boolean);
  let repaired = 0;

  for (const m of mismatches) {
    const row = rows.find((r) => r.id === m!.listingId);
    if (!row) continue;
    const nextAffiliate = resolveListingAffiliateUrl(row.officialUrl, {
      existingAffiliate: null,
    });
    if (apply) {
      await db
        .update(listings)
        .set({ affiliateUrl: nextAffiliate, updatedAt: new Date() })
        .where(eq(listings.id, row.id));
    }
    repaired += 1;
  }

  console.log(
    JSON.stringify(
      {
        apply,
        total: rows.length,
        mismatches: mismatches.length,
        repaired,
        samples: mismatches.slice(0, 25),
      },
      null,
      2,
    ),
  );
  await closeCatalogDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
