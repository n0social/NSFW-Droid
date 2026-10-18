import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { getAdminDashboardSnapshot } from "@/lib/admin-dashboard";
import { parseAnalyticsAudience } from "@/lib/analytics-quality";

export async function GET(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const audience = parseAnalyticsAudience(new URL(request.url).searchParams.get("audience"));
  const snapshot = await getAdminDashboardSnapshot(audience);
  return NextResponse.json(snapshot);
}
