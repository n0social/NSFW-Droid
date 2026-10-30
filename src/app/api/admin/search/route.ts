import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import {
  getAdminSearchSnapshot,
  parseAnalyticsAudience,
} from "@/lib/admin-search-analytics";
import { isGscSyncEnabled } from "@/lib/gsc-config";
import { syncGscSearchCache } from "@/lib/gsc-cache";

export async function GET(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const audience = parseAnalyticsAudience(url.searchParams.get("audience"));
  const snapshot = await getAdminSearchSnapshot(audience);
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGscSyncEnabled()) {
    return NextResponse.json(
      { error: "GSC not configured", missing: ["GSC_SERVICE_ACCOUNT_JSON"] },
      { status: 503 },
    );
  }

  try {
    const cache = await syncGscSearchCache();
    return NextResponse.json({ ok: true, syncedAt: cache.syncedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
