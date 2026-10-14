import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, isCatalogDbHealthy } from "@/db";
import { listings } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings);
    const listingCount = row?.count ?? 0;

    return NextResponse.json(
      {
        status: "ok",
        catalog: { healthy: true, listingCount },
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[health] catalog check failed:", err);
    return NextResponse.json(
      {
        status: "degraded",
        catalog: {
          healthy: false,
          listingCount: null,
          error: message,
          wasHealthy: isCatalogDbHealthy(),
        },
      },
      { status: 503 },
    );
  }
}
