/**
 * itch.io Partner & Affiliate program uses the `ac=` query param on itch.io URLs.
 * @see https://itch.io/partners — apply for a partner account to get a code; only tag links when env is set.
 */

export function itchAffiliateCodeFromEnv(): string | null {
  const raw =
    process.env.ITCH_AFFILIATE_USERNAME?.trim() ||
    process.env.ITCH_REF?.trim() ||
    "";
  return raw || null;
}

export function isItchIoUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "itch.io" || host.endsWith(".itch.io");
  } catch {
    return false;
  }
}

/** Append partner affiliate code (`ac=`) when configured; returns null if URL is not itch.io or code unset. */
export function itchAffiliateUrlForOfficial(officialUrl: string): string | null {
  const code = itchAffiliateCodeFromEnv();
  if (!code) return null;
  const trimmed = officialUrl.trim();
  if (!trimmed || !isItchIoUrl(trimmed)) return null;

  try {
    const u = new URL(trimmed);
    if (u.searchParams.has("ac")) return u.toString();
    u.searchParams.set("ac", code);
    return u.toString();
  } catch {
    return null;
  }
}
