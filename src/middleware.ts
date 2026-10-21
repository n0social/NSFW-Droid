import { NextResponse } from "next/server";

const ROBOTS_TAG = "noindex, nofollow, noarchive";

export function middleware() {
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", ROBOTS_TAG);
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/go", "/api/go/:path*"],
};
