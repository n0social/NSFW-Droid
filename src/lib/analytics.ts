import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, listings } from "@/db/schema";
import { createHash } from "crypto";

export async function recordEvent(input: {
  eventType: "outbound_click" | "listing_view" | "page_view";
  listingId?: string;
  path?: string;
  referrer?: string;
  sessionId?: string;
}) {
  const sessionHash = input.sessionId
    ? createHash("sha256").update(input.sessionId).digest("hex").slice(0, 32)
    : null;
  await db.insert(analyticsEvents).values({
    eventType: input.eventType,
    listingId: input.listingId ?? null,
    path: input.path ?? null,
    referrer: input.referrer ?? null,
    sessionHash,
  });
}

const HOT_DAYS = 7;

export async function getHotListings(limit = 10) {
  const since = new Date(Date.now() - HOT_DAYS * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      listingId: analyticsEvents.listingId,
      clicks: sql<number>`count(*)::int`,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "outbound_click"),
        gte(analyticsEvents.createdAt, since),
      ),
    )
    .groupBy(analyticsEvents.listingId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  const ids = rows.map((r) => r.listingId).filter(Boolean) as string[];
  if (!ids.length) return [];

  const games = await db.select().from(listings);
  const byId = new Map(games.map((g) => [g.id, g]));
  return rows
    .map((r, i) => {
      const game = r.listingId ? byId.get(r.listingId) : undefined;
      if (!game) return null;
      return { ...game, chartRank: i + 1, clickCount: r.clicks };
    })
    .filter(Boolean) as (typeof games)[0][];
}

export async function getRecentPopular(limit = 12) {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const rows = await db
    .select({
      listingId: analyticsEvents.listingId,
      views: sql<number>`count(*)::int`,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "listing_view"),
        gte(analyticsEvents.createdAt, since),
      ),
    )
    .groupBy(analyticsEvents.listingId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  const games = await db.select().from(listings);
  const byId = new Map(games.map((g) => [g.id, g]));
  return rows
    .map((r) => (r.listingId ? byId.get(r.listingId) : undefined))
    .filter(Boolean) as (typeof games)[0][];
}
