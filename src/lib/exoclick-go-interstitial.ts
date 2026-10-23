import { exoclickPopunderLiveReady, isAdsEnabled } from "@/lib/ads-config";
import type { Listing } from "@/db/schema";
import { listingEligibleForPlayPopunder, urlEligibleForOutboundPopunder } from "@/lib/outbound-link";

export function shouldServeExoclickRedirectInterstitial(
  ageVerified: boolean,
  listing?: Pick<Listing, "source" | "officialUrl" | "affiliateUrl">,
  outboundUrl?: string,
): boolean {
  if (!isAdsEnabled() || !ageVerified || !exoclickPopunderLiveReady()) return false;
  if (listing) return listingEligibleForPlayPopunder(listing);
  if (outboundUrl) return urlEligibleForOutboundPopunder(outboundUrl);
  return false;
}
