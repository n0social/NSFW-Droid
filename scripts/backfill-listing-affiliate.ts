import "dotenv/config";
import { and, eq, or, isNull, sql } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";
import { candidates, listings } from "../src/db/schema";
import { itchAffiliateCodeFromEnv, itchAffiliateUrlForOfficial } from "../src/lib/itch-affiliate";

async function main() {
  const code = itchAffiliateCodeFromEnv();
  if (!code) {
    console.log("Skip: set ITCH_AFFILIATE_USERNAME or ITCH_REF to backfill itch affiliate URLs.");
    await closeCatalogDb();
    return;
  }

  const db = await getDb();
  const rows = await db
    .select()
    .from(listings)
    .where(
      and(
        eq(listings.source, "itch"),
        or(isNull(listings.affiliateUrl), sql`trim(${listings.affiliateUrl}) = ''`),
      ),
    );

  let updated = 0;
  for (const listing of rows) {
    if (!listing.source || !listing.externalId) continue;
    let affiliateUrl: string | null = null;

    const [c] = await db
      .select({ rawPayload: candidates.rawPayload })
      .from(candidates)
      .where(
        and(
          eq(candidates.source, listing.source),
          eq(candidates.externalId, listing.externalId),
        ),
      )
      .limit(1);

    const rawAffiliate = (c?.rawPayload as { affiliate_url?: string } | null)?.affiliate_url?.trim();
    if (rawAffiliate) {
      affiliateUrl = rawAffiliate;
    } else {
      affiliateUrl = itchAffiliateUrlForOfficial(listing.officialUrl);
    }

    if (!affiliateUrl) continue;

    await db
      .update(listings)
      .set({ affiliateUrl, updatedAt: new Date() })
      .where(eq(listings.id, listing.id));
    updated += 1;
  }

  console.log(`Backfilled affiliate_url on ${updated} itch listing(s) (code ac=${code}).`);
  await closeCatalogDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
