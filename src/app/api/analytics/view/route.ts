import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/analytics";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const jar = await cookies();
  const sessionId = jar.get("age_verified")?.value ?? "anon";

  await recordEvent({
    eventType: body.listing_id ? "listing_view" : "page_view",
    listingId: body.listing_id ? String(body.listing_id) : undefined,
    path: body.path ? String(body.path) : undefined,
    sessionId,
  });

  return NextResponse.json({ ok: true });
}
