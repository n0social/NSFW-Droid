import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { ensureTrafficMarkerBaseline, getAdminTrafficSnapshot } from "@/lib/admin-traffic";
import { parseAnalyticsAudience } from "@/lib/analytics-quality";

export async function GET(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const audience = parseAnalyticsAudience(new URL(request.url).searchParams.get("audience"));
  const baselineAt = await ensureTrafficMarkerBaseline();
  const snapshot = await getAdminTrafficSnapshot(30, audience);
  return NextResponse.json({ ...snapshot, trafficMarkerBaselineAt: baselineAt ?? snapshot.trafficMarkerBaselineAt });
}
