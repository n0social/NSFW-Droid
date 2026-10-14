import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { listings } from "@/db/schema";
import { recordEvent } from "@/lib/analytics";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await context.params;
  try {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);
    if (!row) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const jar = await cookies();
    const sessionId = jar.get("age_verified")?.value ?? "anon";

    await recordEvent({
      eventType: "outbound_click",
      listingId: row.id,
      path: `/go/${listingId}`,
      referrer: request.headers.get("referer") ?? undefined,
      sessionId,
    });

    return NextResponse.redirect(row.officialUrl, 302);
  } catch (err) {
    console.error("[go] redirect failed:", err);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
