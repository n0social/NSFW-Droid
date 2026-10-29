import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site";

/** Hostnames allowed when Origin/Referer is missing the request Host (e.g. local dev). */
const EXTRA_ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1"]);

function hostFromUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    return new URL(raw).host.toLowerCase();
  } catch {
    return null;
  }
}

/** Public Host / X-Forwarded-Host for this request (first value when proxied). */
export function publicRequestHost(request: Request): string | null {
  const raw = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const first = raw?.split(",")[0]?.trim().toLowerCase();
  return first || hostFromUrl(request.url);
}

/** Hosts that may appear in Origin or Referer for browser POSTs to this app. */
export function allowedPublicPostHosts(request: Request): Set<string> {
  const allowed = new Set<string>(EXTRA_ALLOWED_HOSTS);
  const requestHost = publicRequestHost(request);
  if (requestHost) allowed.add(requestHost);
  const configured = hostFromUrl(siteUrl);
  if (configured) allowed.add(configured);
  return allowed;
}

/**
 * True when the browser claims the POST came from our site (Origin preferred,
 * else Referer). Cross-site form posts and blind fetch from other origins fail.
 */
export function isSameOriginPublicPost(request: Request): boolean {
  const allowed = allowedPublicPostHosts(request);
  const origin = request.headers.get("origin")?.trim();
  if (origin && origin.toLowerCase() !== "null") {
    const host = hostFromUrl(origin);
    return Boolean(host && allowed.has(host));
  }

  const referer = request.headers.get("referer");
  const refHost = hostFromUrl(referer);
  return Boolean(refHost && allowed.has(refHost));
}

export function publicPostCsrfForbidden(): NextResponse {
  return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
}

/** Returns a 403 response when Origin/Referer are not same-site; otherwise null. */
export function rejectCrossSitePublicPost(request: Request): NextResponse | null {
  if (isSameOriginPublicPost(request)) return null;
  return publicPostCsrfForbidden();
}
