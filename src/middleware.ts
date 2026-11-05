import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  hostRedirectForRequest,
  isAdminAppPath,
  isConfiguredAdminHost,
  resolveAdminHostLocations,
} from "@/lib/admin-host";
import { redirectHostForCanonicalOrigin } from "@/lib/canonical-host";
import { cloudflareAccessConfig, readCfAccessJwt, verifyCfAccessJwt } from "@/lib/cf-access";
import { applySecurityHeaders } from "@/lib/security-headers";

/**
 * Node runtime so `CF_ACCESS_*` and `ADMIN_HOST` are read from the process
 * environment on each request (droplet restart), not frozen at build time.
 */
export const runtime = "nodejs";

const ROBOTS_TAG = "noindex, nofollow, noarchive";

function finish(request: NextRequest, response: NextResponse): NextResponse {
  applySecurityHeaders(request, response);
  return response;
}

export async function middleware(request: NextRequest) {
  const locations = resolveAdminHostLocations();
  const host = request.headers.get("host");
  const { pathname, search } = request.nextUrl;
  const onAdmin = isConfiguredAdminHost(host, locations);

  const hostRedirect = hostRedirectForRequest(host, pathname, search, locations);
  if (hostRedirect) {
    const response = NextResponse.redirect(hostRedirect.location, hostRedirect.status);
    if (onAdmin || isAdminAppPath(pathname)) {
      response.headers.set("X-Robots-Tag", ROBOTS_TAG);
    }
    return finish(request, response);
  }

  const targetHost = redirectHostForCanonicalOrigin(host);
  if (targetHost) {
    const canonical = new URL(`https://${targetHost}${pathname}${search}`);
    return finish(request, NextResponse.redirect(canonical, 301));
  }

  if (onAdmin && isAdminAppPath(pathname)) {
    const access = cloudflareAccessConfig();
    if (access) {
      const token = readCfAccessJwt(
        request.headers.get("cf-access-jwt-assertion"),
        request.cookies.get("CF_Authorization")?.value ?? null,
      );
      const allowed = token ? await verifyCfAccessJwt(token, access) : false;
      if (!allowed) {
        const denied = new NextResponse("Unauthorized", {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
            "X-Robots-Tag": ROBOTS_TAG,
          },
        });
        return finish(request, denied);
      }
    }
  }

  const needsNoIndex =
    onAdmin ||
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
     * Host canonicalization, admin host split, and selective X-Robots-Tag.
     * Skip static assets and well-known icons (admin pages may still request them).
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|icons/|apple-icon.png|og-default.png|manifest.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
