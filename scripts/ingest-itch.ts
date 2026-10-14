import "dotenv/config";
import { XMLParser } from "fast-xml-parser";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { candidates, ingestSources, listings } from "../src/db/schema";

const FEED_URL = "https://itch.io/feed/new.xml";
const USER_AGENT = "NSFW-Droid-Catalog/0.1 (link catalog; +https://github.com/n0social/NSFW-Droid)";

function slugify(title: string, suffix: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${suffix.slice(0, 8)}`;
}

async function publishCandidate(
  c: typeof candidates.$inferSelect,
  rank?: number,
) {
  const slug = slugify(c.title, c.externalId);
  const [existing] = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.slug, slug))
    .limit(1);
  if (existing) return;

  await db.insert(listings).values({
    slug,
    title: c.title,
    platforms: ["browser"],
    officialUrl: c.outboundUrl,
    artworkSource: "typographic",
    source: c.source,
    externalId: c.externalId,
    chartRank: rank ?? null,
    chartBucket: rank ? "top_grossing" : "new",
  });

  await db
    .update(candidates)
    .set({
      reviewStatus: "approved",
      reviewedAt: new Date(),
      reviewedBy: "demo_auto_publish",
    })
    .where(eq(candidates.id, c.id));
}

async function main() {
  const res = await fetch(FEED_URL, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`itch feed HTTP ${res.status}`);
  }
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);
  const items = doc?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];

  let inserted = 0;
  for (const item of list) {
    const title = String(item.title ?? "").trim();
    const link = String(item.link ?? "").trim();
    const guid = String(item.guid?.["#text"] ?? item.guid ?? link).trim();
    if (!title || !link) continue;

    const result = await db
      .insert(candidates)
      .values({
        source: "itch",
        externalId: guid,
        title,
        outboundUrl: link,
        rawPayload: item,
      })
      .onConflictDoNothing()
      .returning({ id: candidates.id });

    if (result.length) inserted += 1;
  }

  await db
    .insert(ingestSources)
    .values({
      name: "itch_new_xml",
      lastRunAt: new Date(),
      lastError: null,
      cursor: { fetched: list.length },
    })
    .onConflictDoUpdate({
      target: ingestSources.name,
      set: {
        lastRunAt: new Date(),
        lastError: null,
        cursor: { fetched: list.length },
      },
    });

  const autoPublish = process.env.DEMO_AUTO_PUBLISH === "1";
  let published = 0;
  if (autoPublish) {
    const pending = await db
      .select()
      .from(candidates)
      .where(eq(candidates.reviewStatus, "pending"))
      .limit(40);
    let rank = 1;
    for (const c of pending) {
      await publishCandidate(c, rank <= 10 ? rank : undefined);
      published += 1;
      if (rank <= 10) rank += 1;
    }
  }

  console.log(
    JSON.stringify({
      feedItems: list.length,
      newCandidates: inserted,
      autoPublished: published,
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
