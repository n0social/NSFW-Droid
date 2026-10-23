"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import type { Listing } from "@/db/schema";
import { shouldShowPlayPopunder } from "@/lib/ads-config";
import {
  firePlayStorePopunder,
  openOutboundInNewTab,
} from "@/lib/exoclick-play-popunder-client";
import { listingEligibleForPlayPopunder } from "@/lib/outbound-link";

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
 * Outbound store CTA. Popunder: stay on site, one new store tab, ad in hidden iframe.
 * Uses `<button>` when monetized so `/api/go` is not a real anchor for ad tag hooks.
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
  const popunderEligible =
    monetize &&
    shouldShowPlayPopunder(ageVerified) &&
    listingEligibleForPlayPopunder(listing);

  function handleMonetizedClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const goHref = new URL(href, window.location.origin).href;
    if (!firePlayStorePopunder(goHref)) {
      openOutboundInNewTab(goHref);
    }
    onClick?.(e as unknown as MouseEvent<HTMLAnchorElement>);
  }

  if (popunderEligible) {
    const { type: _type, ...buttonRest } = rest as ComponentPropsWithoutRef<"button">;
    return (
      <button
        type="button"
        className={className}
        onClick={handleMonetizedClick}
        {...buttonRest}
      >
        {children}
      </button>
    );
  }

  return (
    <a className={className} href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}
