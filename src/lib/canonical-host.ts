import { siteUrl } from "@/lib/site";

/** Hostname from `NEXT_PUBLIC_SITE_URL` (e.g. `www.nsfwdroid.com`). */
export function primarySiteHost(): string {
  try {
    return new URL(siteUrl).host.toLowerCase();
  } catch {
    return "www.nsfwdroid.com";
  }
}

/**
 * When the request hits the bare apex `nsfwdroid.com`, return the primary www host
 * so we can 301 to a single canonical origin (fixes GSC “alternate page with canonical”).
 */
export function redirectHostForCanonicalOrigin(requestHost: string | null | undefined): string | null {
  if (!requestHost) return null;
  const host = requestHost.split(":")[0].toLowerCase();
  const primary = primarySiteHost();
  if (host === primary) return null;
  if (host === "nsfwdroid.com") return primary;
  return null;
}
