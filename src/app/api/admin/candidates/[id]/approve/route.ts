import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { approveCandidate } from "@/lib/review";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const listing = await approveCandidate(id, "admin");
  if (!listing) {
    return NextResponse.json({ error: "not_found_or_not_pending" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, listing });
}
