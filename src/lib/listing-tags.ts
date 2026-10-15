import { asc, eq, inArray } from "drizzle-orm";
import type { getDb } from "@/db";
import { listingTags, tags, type Tag } from "@/db/schema";

type Db = Awaited<ReturnType<typeof getDb>>;

export async function getTagSlugsByListingIds(
  db: Db,
  listingIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!listingIds.length) return map;

  const rows = await db
    .select({ listingId: listingTags.listingId, slug: tags.slug })
    .from(listingTags)
    .innerJoin(tags, eq(listingTags.tagId, tags.id))
    .where(inArray(listingTags.listingId, listingIds));

  for (const row of rows) {
    const list = map.get(row.listingId) ?? [];
    list.push(row.slug);
    map.set(row.listingId, list);
  }
  return map;
}

export async function listBrowseTags(db: Db): Promise<Tag[]> {
  return db.select().from(tags).orderBy(asc(tags.label));
}
