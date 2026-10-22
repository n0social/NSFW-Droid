import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { clientIp } from "@/lib/rate-limit";
import { approveCandidate } from "@/lib/review";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const listing = await approveCandidate(id, "admin");
  if (!listing) {
    return NextResponse.json(
      { error: "not_found_or_not_pending_or_missing_store_cover" },
      { status: 404 },
    );
  }
  await logAdminAction({
    action: "candidate_approve",
    targetId: id,
    ip: clientIp(request),
    metadata: { listing_id: listing.id, title: listing.title },
  }).catch(() => {});
  return NextResponse.json({ ok: true, listing });
}
