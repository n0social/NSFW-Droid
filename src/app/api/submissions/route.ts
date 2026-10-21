import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getDb } from "@/db";
import { developerSubmissions } from "@/db/schema";
import { isIngestAutoPublishEnabled } from "@/lib/auto-publish";
import { rejectCrossSitePublicPost } from "@/lib/public-post-csrf";
import { upsertCandidate } from "@/lib/submit-helper";

export async function POST(request: Request) {
  const csrf = rejectCrossSitePublicPost(request);
  if (csrf) return csrf;

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.official_url || !body?.contact_email) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const title = String(body.title).trim().slice(0, 200);
  const officialUrl = String(body.official_url).trim();
  const email = String(body.contact_email).trim().slice(0, 320);
  const message = body.message ? String(body.message).trim().slice(0, 2000) : null;
  const platforms = Array.isArray(body.platforms)
    ? body.platforms.map((p: string) => String(p).trim()).filter(Boolean)
    : ["browser"];

  try {
    new URL(officialUrl);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_url" }, { status: 400 });
  }

  const externalId = createHash("sha256")
    .update(`${email}:${officialUrl}:${title}`)
    .digest("hex")
    .slice(0, 32);

  const { inserted, id: candidateId } = await upsertCandidate({
    source: "developer_form",
    externalId,
    title,
    outboundUrl: officialUrl,
    rawPayload: { platforms, contact_email: email, message },
  });

  const db = await getDb();
  const [sub] = await db
    .insert(developerSubmissions)
    .values({ contactEmail: email, message, candidateId })
    .returning();

  const autoOn = isIngestAutoPublishEnabled();
  const statusMessage = autoOn
    ? "Received. TOS-clear submissions publish automatically; flagged items stay in the review queue."
    : "Queued for review. Listings are not published automatically until staff approves.";

  return NextResponse.json({
    ok: true,
    duplicate: !inserted,
    submissionId: sub.id,
    autoPublishEnabled: autoOn,
    message: statusMessage,
  });
}
