import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { candidates } from "@/db/schema";
import { isAdminSession } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = await getDb();
  const rows = await db
    .select()
    .from(candidates)
    .where(eq(candidates.reviewStatus, "pending"))
    .orderBy(desc(candidates.firstSeenAt))
    .limit(100);
  return NextResponse.json({ candidates: rows });
}
