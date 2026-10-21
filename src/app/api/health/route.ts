import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, isCatalogDbHealthy } from "@/db";
import { getCatalogLastIngestAt } from "@/lib/catalog-ingest-status";
import { getMaintenanceNotice } from "@/lib/maintenance-notice";
import { getCatalogCountSnapshot } from "@/lib/catalog-counts";
import {
  isNewsletterEmailDeliveryConfigured,
  isNewsletterMassSendEnabled,
  newsletterSigningSecretProductionIssue,
  newsletterTransport,
} from "@/lib/newsletter/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const maintenanceNotice = await getMaintenanceNotice();
  const newsletterSigningWarning = newsletterSigningSecretProductionIssue();
  const newsletterHealth = {
    signingSecretConfigured: !newsletterSigningWarning,
    ...(newsletterSigningWarning ? { warning: newsletterSigningWarning } : {}),
    transport: newsletterTransport(),
    massSendEnabled: isNewsletterMassSendEnabled(),
    deliveryConfigured: isNewsletterEmailDeliveryConfigured(),
  };
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    const counts = await getCatalogCountSnapshot();
    const catalogLastIngestAt = await getCatalogLastIngestAt();

    return NextResponse.json(
      {
        status: "ok",
        catalog: {
          healthy: true,
          listingCount: counts.displayedCount,
          displayedCount: counts.displayedCount,
          listingsTotal: counts.listingsTotal,
          staleListings: counts.staleListings,
          brokenLinkListings: counts.brokenLinkListings,
          candidatesTotal: counts.candidatesTotal,
          candidatesPending: counts.candidatesPending,
          browsePageSize: counts.browsePageSize,
          browsePageCount: counts.browsePageCount,
        },
        catalogLastIngestAt: catalogLastIngestAt?.toISOString() ?? null,
        maintenanceNotice,
        newsletter: newsletterHealth,
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
        newsletter: newsletterHealth,
      },
      { status: 503 },
    );
  }
}
