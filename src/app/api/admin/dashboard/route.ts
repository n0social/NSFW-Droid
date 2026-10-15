import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { getAdminDashboardSnapshot } from "@/lib/admin-dashboard";

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const snapshot = await getAdminDashboardSnapshot();
  return NextResponse.json(snapshot);
}
