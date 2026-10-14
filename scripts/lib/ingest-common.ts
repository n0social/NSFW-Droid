import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { candidates, ingestSources, listings } from "../../src/db/schema";

export const USER_AGENT =
  "NSFW-Droid-Catalog/0.1 (link catalog; +https://github.com/n0social/NSFW-Droid)";

export function slugify(title: string, suffix: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${suffix.slice(0, 8)}`;
}

export async function upsertCandidate(input: {
  source: "itch" | "steam" | "affiliate_export" | "developer_form";
  externalId: string;
  title: string;
  outboundUrl: string;
  rawPayload?: unknown;
}) {
  const result = await db
    .insert(candidates)
    .values({
      source: input.source,
      externalId: input.externalId,
      title: input.title,
      outboundUrl: input.outboundUrl,
      rawPayload: input.rawPayload ?? null,
    })
    .onConflictDoNothing()
    .returning({ id: candidates.id });
  return result.length > 0;
}

export async function touchIngestSource(
  name: string,
  cursor: Record<string, unknown>,
  lastError: string | null = null,
) {
  await db
    .insert(ingestSources)
    .values({
      name,
      lastRunAt: new Date(),
      lastError,
      cursor,
    })
    .onConflictDoUpdate({
      target: ingestSources.name,
      set: {
        lastRunAt: new Date(),
        lastError,
        cursor,
      },
    });
}

function platformsForSource(
  source: string,
  raw: unknown,
): string[] {
  if (source === "steam") {
    const p = raw as { platforms?: string[] } | null;
    return p?.platforms?.length ? p.platforms : ["windows"];
  }
  if (source === "affiliate_export") return ["browser", "android"];
  return ["browser"];
}

export async function publishCandidate(
  c: typeof candidates.$inferSelect,
  rank?: number,
) {
  const slug = slugify(c.title, c.externalId);
  const [existing] = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.slug, slug))
    .limit(1);
  if (existing) return false;

  const raw = c.rawPayload as { affiliate_url?: string } | null;

  await db.insert(listings).values({
    slug,
    title: c.title,
    platforms: platformsForSource(c.source, c.rawPayload),
    officialUrl: c.outboundUrl,
    affiliateUrl: raw?.affiliate_url ?? null,
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
  return true;
}

export async function autoPublishDemo(limit = 80) {
  if (process.env.DEMO_AUTO_PUBLISH !== "1") return 0;
  const pending = await db
    .select()
    .from(candidates)
    .where(eq(candidates.reviewStatus, "pending"))
    .limit(limit);
  let published = 0;
  let rank = 1;
  for (const c of pending) {
    const ok = await publishCandidate(c, rank <= 10 ? rank : undefined);
    if (ok) published += 1;
    if (rank <= 10) rank += 1;
  }
  return published;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
