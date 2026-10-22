"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import type { Listing } from "@/db/schema";
import { shouldShowPlayPopunder } from "@/lib/ads-config";
import { firePlayPopunderThenNavigate } from "@/lib/exoclick-play-popunder-client";
import { listingEligibleForPlayPopunder } from "@/lib/outbound-link";

type ListingPick = Pick<Listing, "source" | "officialUrl" | "affiliateUrl">;

type Props = ComponentPropsWithoutRef<"a"> & {
  listing: ListingPick;
  /** When false, never run popunder (e.g. fallback links). */
  monetize?: boolean;
  ageVerified: boolean;
};

/**
 * Outbound store CTA. `/api/go/…` opens in a focused new tab when popunder runs (ad
 * behind); otherwise default same-tab navigation. Non-Steam listings only.
 */
export function OutboundPlayLink({
  monetize = true,
  ageVerified,
  listing,
  className,
  onClick,
  children,
  ...rest
}: Props) {
  const popunderEligible =
    monetize &&
    shouldShowPlayPopunder(ageVerified) &&
    listingEligibleForPlayPopunder(listing);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (popunderEligible) {
      const href = e.currentTarget.href;
      if (firePlayPopunderThenNavigate(href)) {
        e.preventDefault();
        onClick?.(e);
        return;
      }
    }
    onClick?.(e);
  }

  return (
    <a className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
