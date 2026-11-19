"use client";

import type { ComponentPropsWithoutRef } from "react";
import type { Listing } from "@/db/schema";
import { useAdsPublicConfig } from "@/components/AdsConfigProvider";
import { shouldShowPlayPopunderFromConfig } from "@/lib/ads-public-config";
import { listingEligibleForPlayPopunder } from "@/lib/outbound-link";
import { outboundPlayLinkClassName } from "@/lib/outbound-play-link";

type ListingPick = Pick<Listing, "source" | "officialUrl" | "affiliateUrl">;

type AnchorProps = ComponentPropsWithoutRef<"a">;

type Props = Omit<AnchorProps, "href"> & {
  href: string;
  listing: ListingPick;
  /** When false, never run popunder (e.g. fallback links). */
  monetize?: boolean;
  ageVerified: boolean;
};

/**
 * Outbound store CTA. Eligible non-Steam Play is a real same-tab link with class
 * `nsfwdroid-play-outbound`. ExoClick's popunder script (trigger method 2) counts
 * that click. Steam and pre-age-gate clicks omit the class.
 */
export function OutboundPlayLink({
  monetize = true,
  ageVerified,
  listing,
  href,
  className,
  onClick,
  children,
  ...rest
}: Props) {
  const adsConfig = useAdsPublicConfig();
  const popunderEligible =
    monetize &&
    shouldShowPlayPopunderFromConfig(adsConfig, ageVerified) &&
    listingEligibleForPlayPopunder(listing);

  return (
    <a
      className={popunderEligible ? outboundPlayLinkClassName(className) : className}
      href={href}
      onClick={onClick}
      {...rest}
    >
      {children}
    </a>
  );
}
