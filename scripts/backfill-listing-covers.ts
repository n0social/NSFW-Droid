import "dotenv/config";
import { and, eq, isNull } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";
import { candidates, listings } from "../src/db/schema";
import {
  artworkSourceForCover,
  extractCoverImageUrl,
} from "../src/lib/listing-cover";

async function main() {
  const db = await getDb();
  const rows = await db.select().from(listings).where(isNull(listings.coverImageUrl));

  let updated = 0;
  for (const listing of rows) {
    if (listing.coverImageUrl) continue;
    if (!listing.source || !listing.externalId) continue;

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

    const cover = extractCoverImageUrl(listing.source, c?.rawPayload);
    if (!cover) continue;

    await db
      .update(listings)
      .set({
        coverImageUrl: cover,
        artworkSource: artworkSourceForCover(cover),
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listing.id));
    updated += 1;
  }

  console.log(`Backfilled cover_image_url on ${updated} listing(s).`);
  await closeCatalogDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
