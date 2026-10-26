import "dotenv/config";
import { and, eq, isNull, or } from "drizzle-orm";
import { getDb } from "../src/db";
import { candidates, listings } from "../src/db/schema";
import { storeDescriptionFromRawPayload } from "../src/lib/listing-store-description";

async function main() {
  const db = await getDb();
  const rows = await db
    .select({
      listingId: listings.id,
      source: listings.source,
      externalId: listings.externalId,
      storeDescription: listings.storeDescription,
      rawPayload: candidates.rawPayload,
    })
    .from(listings)
    .innerJoin(
      candidates,
      and(eq(candidates.source, listings.source), eq(candidates.externalId, listings.externalId)),
    )
    .where(
      or(isNull(listings.storeDescription), eq(listings.storeDescription, "")),
    );

  let updated = 0;
  for (const row of rows) {
    const text = storeDescriptionFromRawPayload(row.source, row.rawPayload);
    if (!text) continue;
    await db
      .update(listings)
      .set({ storeDescription: text, updatedAt: new Date() })
      .where(eq(listings.id, row.listingId));
    updated += 1;
  }
  console.log(JSON.stringify({ scanned: rows.length, updated }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
