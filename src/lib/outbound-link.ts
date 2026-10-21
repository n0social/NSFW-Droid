import type { Listing } from "@/db/schema";

export type OutboundLinkKind = "affiliate" | "official";

export type StoreTargetKind = "steam" | "itch" | "unknown";

export type StoreTarget = {
  kind: StoreTargetKind;
  /** Steam app id or itch `creator/slug` (lowercase, no query). */
  key: string;
};

export type OutboundPairMismatch = {
  listingId: string;
  title: string;
  source: Listing["source"];
  reason: string;
  officialUrl: string;
  affiliateUrl: string;
};

export function isValidOutboundUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Hostnames that must never be fetched by the app (cloud metadata, loopback names). */
const BLOCKED_FETCH_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
]);

export type OutboundFetchBlockReason =
  | "invalid_url"
  | "protocol"
  | "credentials"
  | "blocked_hostname"
  | "private_ip";

function normalizeFetchHostname(hostname: string): string {
  const h = hostname.trim().toLowerCase();
  if (h.startsWith("[") && h.endsWith("]")) {
    return h.slice(1, -1);
  }
  return h;
}

/** True when the host is a literal IP in a private, link-local, or metadata range. */
export function isPrivateOrMetadataIp(ip: string): boolean {
  const trimmed = ip.trim();
  if (!trimmed) return true;

  const v4Match = trimmed.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4Match) {
    const octets = v4Match.slice(1).map((n) => Number(n));
    if (octets.some((n) => n > 255)) return true;
    const [a, b] = octets;
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }

  const lower = trimmed.toLowerCase();
  if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
  if (lower.startsWith("fe80:") || /^fe[89ab][0-9a-f]:/.test(lower)) return true;
  if (/^f[cd][0-9a-f]{2}:/.test(lower) || lower.startsWith("fc") || lower.startsWith("fd")) return true;
  const v4Mapped = lower.match(/^::ffff:(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4Mapped) {
    return isPrivateOrMetadataIp(v4Mapped.slice(1).join("."));
  }
  return false;
}

function outboundFetchHostnameBlockReason(hostname: string): OutboundFetchBlockReason | null {
  const host = normalizeFetchHostname(hostname);
  if (!host) return "blocked_hostname";
  if (BLOCKED_FETCH_HOSTNAMES.has(host)) return "blocked_hostname";
  if (host === "169.254.169.254" || host.endsWith(".internal")) return "blocked_hostname";
  if (isPrivateOrMetadataIp(host)) return "private_ip";
  return null;
}

/**
 * Static SSRF checks for server-side fetches (protocol, credentials, host/IP literals).
 * DNS resolution is validated separately in {@link fetchSafeOutboundUrl}.
 */
export function outboundFetchBlockReason(url: string): OutboundFetchBlockReason | null {
  const trimmed = url.trim();
  if (!trimmed) return "invalid_url";
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return "invalid_url";
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return "protocol";
  if (u.username || u.password) return "credentials";
  const hostReason = outboundFetchHostnameBlockReason(u.hostname);
  if (hostReason) return hostReason;
  return null;
}

export function isSafeOutboundFetchUrl(url: string): boolean {
  return outboundFetchBlockReason(url) === null;
}

/** Normalize a store URL to a comparable target (steam app id or itch game path). */
export function parseStoreTarget(url: string): StoreTarget | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();

    if (host === "store.steampowered.com" || host.endsWith(".steampowered.com")) {
      const m = u.pathname.match(/\/app\/(\d+)/i);
      if (!m) return null;
      return { kind: "steam", key: m[1] };
    }

    if (host === "itch.io" || host.endsWith(".itch.io")) {
      const parts = u.pathname.split("/").filter(Boolean);
      if (host !== "itch.io" && host !== "www.itch.io") {
        const creator = host.replace(/\.itch\.io$/i, "").toLowerCase();
        const slug = parts[0]?.toLowerCase();
        if (creator && slug) return { kind: "itch", key: `${creator}/${slug}` };
      }
      if (parts.length >= 2) {
        return { kind: "itch", key: `${parts[0].toLowerCase()}/${parts[1].toLowerCase()}` };
      }
      return null;
    }

    return { kind: "unknown", key: `${host}${u.pathname}`.toLowerCase() };
  } catch {
    return null;
  }
}

function stripAffiliateQueryParams(url: string): string {
  try {
    const u = new URL(url.trim());
    u.searchParams.delete("ac");
    u.searchParams.delete("utm_source");
    u.searchParams.delete("utm_medium");
    u.searchParams.delete("utm_campaign");
    u.searchParams.delete("ref");
    return u.toString();
  } catch {
    return url.trim();
  }
}

/** True when affiliate is the same store listing as official (itch `ac=` and UTM params allowed). */
export function affiliatePairsWithOfficial(officialUrl: string, affiliateUrl: string): boolean {
  const official = officialUrl.trim();
  const affiliate = affiliateUrl.trim();
  if (!official || !affiliate) return false;
  if (official === affiliate) return true;

  const offTarget = parseStoreTarget(official);
  const affTarget = parseStoreTarget(affiliate);
  if (offTarget && affTarget) {
    if (offTarget.kind !== affTarget.kind) return false;
    if (offTarget.kind !== "unknown" && offTarget.key === affTarget.key) return true;
  }

  return stripAffiliateQueryParams(official) === stripAffiliateQueryParams(affiliate);
}

export function outboundPairMismatch(
  listing: Pick<Listing, "id" | "title" | "source" | "affiliateUrl" | "officialUrl">,
): OutboundPairMismatch | null {
  const official = listing.officialUrl?.trim() ?? "";
  const affiliate = listing.affiliateUrl?.trim() ?? "";
  if (!affiliate || affiliate === official) return null;
  if (!isValidOutboundUrl(official) || !isValidOutboundUrl(affiliate)) return null;
  if (affiliatePairsWithOfficial(official, affiliate)) return null;

  const offTarget = parseStoreTarget(official);
  const affTarget = parseStoreTarget(affiliate);
  let reason = "unpaired_urls";
  if (offTarget && affTarget && offTarget.kind !== affTarget.kind) {
    reason = `${offTarget.kind}_vs_${affTarget.kind}`;
  } else if (offTarget && affTarget && offTarget.key !== affTarget.key) {
    reason = `${offTarget.kind}_key_mismatch`;
  }

  return {
    listingId: listing.id,
    title: listing.title,
    source: listing.source,
    reason,
    officialUrl: official,
    affiliateUrl: affiliate,
  };
}

/** Pick redirect target: affiliate when set, valid, and pairs with official; otherwise official. */
export function resolveOutboundLink(listing: Pick<Listing, "affiliateUrl" | "officialUrl">): {
  url: string;
  linkKind: OutboundLinkKind;
} {
  const affiliate = listing.affiliateUrl?.trim() ?? "";
  const official = listing.officialUrl?.trim() ?? "";
  if (
    affiliate &&
    isValidOutboundUrl(affiliate) &&
    isValidOutboundUrl(official) &&
    affiliatePairsWithOfficial(official, affiliate)
  ) {
    return { url: affiliate, linkKind: "affiliate" };
  }
  return { url: official, linkKind: "official" };
}

export function listingHasAffiliateLink(
  listing: Pick<Listing, "affiliateUrl" | "officialUrl">,
): boolean {
  const affiliate = listing.affiliateUrl?.trim() ?? "";
  const official = listing.officialUrl?.trim() ?? "";
  return Boolean(
    affiliate &&
      isValidOutboundUrl(affiliate) &&
      isValidOutboundUrl(official) &&
      affiliatePairsWithOfficial(official, affiliate),
  );
}
