import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, isCatalogDbHealthy } from "@/db";
import { getCatalogLastIngestAt } from "@/lib/catalog-ingest-status";
import { getMaintenanceNotice } from "@/lib/maintenance-notice";
import { getPublishedListingCount } from "@/lib/listings";

export const dynamic = "force-dynamic";

export async function GET() {
  const maintenanceNotice = await getMaintenanceNotice();
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    const listingCount = await getPublishedListingCount();
    const catalogLastIngestAt = await getCatalogLastIngestAt();

    return NextResponse.json(
      {
        status: "ok",
        catalog: { healthy: true, listingCount },
        catalogLastIngestAt: catalogLastIngestAt?.toISOString() ?? null,
        maintenanceNotice,
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
        catalogLastIngestAt: null,
        maintenanceNotice,
      },
      { status: 503 },
    );
  }
}
