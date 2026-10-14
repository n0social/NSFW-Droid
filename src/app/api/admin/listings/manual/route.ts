import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { clientIp } from "@/lib/rate-limit";
import { createManualListing } from "@/lib/review";

export async function POST(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const officialUrl = String(body.official_url ?? "").trim();
  const platforms = Array.isArray(body.platforms) ? body.platforms.map(String) : ["browser"];
  if (!title || !officialUrl) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const listing = await createManualListing({
    title,
    officialUrl,
    platforms,
    reviewer: "admin",
  });
  await logAdminAction({
    action: "manual_listing",
    targetId: listing.id,
    ip: clientIp(request),
    metadata: { title, official_url: officialUrl },
  }).catch(() => {});
  return NextResponse.json({ ok: true, listing });
}
