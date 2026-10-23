"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import type { Listing } from "@/db/schema";
import { shouldShowPlayPopunder } from "@/lib/ads-config";
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
 * Store Play CTA. Monetized: same-tab `/api/go` (server ExoClick + 302). No `window.open`.
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
    window.location.assign(new URL(href, window.location.origin).href);
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
