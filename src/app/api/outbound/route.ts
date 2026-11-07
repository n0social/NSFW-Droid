import { NextResponse } from "next/server";
import { isValidOutboundUrl } from "@/lib/outbound-link";

/**
 * Optional same-tab redirect for a raw outbound URL.
 * Popunder billing is not done here. A server fetch of s.pemsrv.com does not bill;
 * eligible clicks are classed links counted by popunder1000.js in the browser.
 */
export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const raw = reqUrl.searchParams.get("u")?.trim() ?? "";
  if (!raw || !isValidOutboundUrl(raw)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.redirect(raw, 302);
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}
