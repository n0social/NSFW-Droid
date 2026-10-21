import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { listingReports, listings } from "@/db/schema";
import {
  hashReporterIp,
  isListingReportReason,
} from "@/lib/listing-report";
import { rejectCrossSitePublicPost } from "@/lib/public-post-csrf";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const csrf = rejectCrossSitePublicPost(request);
  if (csrf) return csrf;

  const body = await request.json().catch(() => null);
  const listingId = body?.listing_id ? String(body.listing_id).trim() : "";
  const reasonRaw = body?.reason ? String(body.reason).trim() : "";
  const details = body?.details ? String(body.details).trim().slice(0, 2000) : null;

  if (!listingId || !isListingReportReason(reasonRaw)) {
    return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 });
  }

  const ip = clientIp(request);
  if (!rateLimit(`listing-report:${ip}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const db = await getDb();
  const [listing] = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!listing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const [row] = await db
    .insert(listingReports)
    .values({
      listingId,
      reason: reasonRaw,
      details: details || null,
      ipHash: hashReporterIp(ip),
    })
    .returning({ id: listingReports.id });

  return NextResponse.json({ ok: true, reportId: row.id });
}
