import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { redirectHostForCanonicalOrigin } from "@/lib/canonical-host";

const ROBOTS_TAG = "noindex, nofollow, noarchive";

export function middleware(request: NextRequest) {
  const targetHost = redirectHostForCanonicalOrigin(request.headers.get("host"));
  if (targetHost) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.host = targetHost;
    return NextResponse.redirect(url, 301);
  }

  const pathname = request.nextUrl.pathname;
  const needsNoIndex =
    pathname.startsWith("/admin") ||
    pathname === "/api/go" ||
    pathname.startsWith("/api/go/");

  if (!needsNoIndex) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", ROBOTS_TAG);
  return response;
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
