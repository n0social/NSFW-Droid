import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { ensureTrafficMarkerBaseline, getAdminTrafficSnapshot } from "@/lib/admin-traffic";

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baselineAt = await ensureTrafficMarkerBaseline();
  const snapshot = await getAdminTrafficSnapshot(30);
  return NextResponse.json({ ...snapshot, trafficMarkerBaselineAt: baselineAt ?? snapshot.trafficMarkerBaselineAt });
}
