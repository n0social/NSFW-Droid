import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { redirectHostForCanonicalOrigin } from "@/lib/canonical-host";
import { applySecurityHeaders } from "@/lib/security-headers";

const ROBOTS_TAG = "noindex, nofollow, noarchive";

function finish(request: NextRequest, response: NextResponse): NextResponse {
  applySecurityHeaders(request, response);
  return response;
}

export function middleware(request: NextRequest) {
  const targetHost = redirectHostForCanonicalOrigin(request.headers.get("host"));
  if (targetHost) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.host = targetHost;
    return finish(request, NextResponse.redirect(url, 301));
  }

  const pathname = request.nextUrl.pathname;
  const needsNoIndex =
    pathname.startsWith("/admin") ||
    pathname === "/api/go" ||
    pathname.startsWith("/api/go/") ||
    pathname.startsWith("/api/outbound") ||
    pathname.startsWith("/api/ads/");

  const response = NextResponse.next();
  if (needsNoIndex) {
    response.headers.set("X-Robots-Tag", ROBOTS_TAG);
  }
  return finish(request, response);
}

export const config = {
  matcher: [
    /*
     * Host canonicalization + selective X-Robots-Tag.
     * Skip static assets and well-known icons.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|icons/|apple-icon.png|og-default.png|manifest.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
