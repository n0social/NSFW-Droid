import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { clientIp } from "@/lib/rate-limit";
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
  const reason = String(body.reason ?? "rejected");
  await rejectCandidate(id, "admin", reason);
  await logAdminAction({
    action: "candidate_reject",
    targetId: id,
    ip: clientIp(request),
    metadata: { reason },
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
