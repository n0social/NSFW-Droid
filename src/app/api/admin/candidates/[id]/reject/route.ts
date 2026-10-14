import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { rejectCandidate } from "@/lib/review";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { id } = await context.params;
  await rejectCandidate(id, "admin", String(body.reason ?? "rejected"));
  return NextResponse.json({ ok: true });
}
