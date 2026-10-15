import type { Listing } from "@/db/schema";

export type OutboundLinkKind = "affiliate" | "official";

export function isValidOutboundUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Pick redirect target: affiliate when set and valid, otherwise official store URL. */
export function resolveOutboundLink(listing: Pick<Listing, "affiliateUrl" | "officialUrl">): {
  url: string;
  linkKind: OutboundLinkKind;
} {
  const affiliate = listing.affiliateUrl?.trim() ?? "";
  if (affiliate && isValidOutboundUrl(affiliate)) {
    return { url: affiliate, linkKind: "affiliate" };
  }
  return { url: listing.officialUrl, linkKind: "official" };
}

export function listingHasAffiliateLink(
  listing: Pick<Listing, "affiliateUrl">,
): boolean {
  const affiliate = listing.affiliateUrl?.trim() ?? "";
  return Boolean(affiliate && isValidOutboundUrl(affiliate));
}
