import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/user-session";

export async function requireSessionUserId(): Promise<string | NextResponse> {
  const uid = await getSessionUserId();
  if (!uid) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return uid;
}
