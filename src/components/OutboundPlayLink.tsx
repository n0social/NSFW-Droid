"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { Listing } from "@/db/schema";
import { shouldShowPlayPopunder } from "@/lib/ads-config";
import {
  EXOCLICK_POPUNDER_REFERRER_HOME,
  firePlayStorePopunder,
  openOutboundInNewTab,
  prefetchPopunderAdUrl,
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
 * Outbound store CTA. When popunder applies: `<button>` (not `<a>`) so ad scripts cannot
 * intercept the href; stay on NSFW Droid, open store + prefetched ad in new tabs.
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

  const [prefetchedAdUrl, setPrefetchedAdUrl] = useState<string | null>(null);
  const prefetchStarted = useRef(false);

  useEffect(() => {
    if (!popunderEligible || prefetchStarted.current) return;
    prefetchStarted.current = true;
    void prefetchPopunderAdUrl(EXOCLICK_POPUNDER_REFERRER_HOME).then(setPrefetchedAdUrl);
  }, [popunderEligible]);

  async function runPopunderPlay(goHref: string) {
    let adUrl = prefetchedAdUrl;
    if (!adUrl) {
      adUrl = await prefetchPopunderAdUrl(EXOCLICK_POPUNDER_REFERRER_HOME);
      setPrefetchedAdUrl(adUrl);
    }
    if (!firePlayStorePopunder(goHref, { prefetchedAdUrl: adUrl })) {
      openOutboundInNewTab(goHref);
    }
  }

  function handleClick(e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (popunderEligible) {
      const goHref =
        e.currentTarget instanceof HTMLAnchorElement
          ? e.currentTarget.href
          : new URL(href, window.location.origin).href;
      void runPopunderPlay(goHref);
      onClick?.(e as MouseEvent<HTMLAnchorElement>);
      return;
    }

    if (e.currentTarget instanceof HTMLAnchorElement) {
      onClick?.(e as MouseEvent<HTMLAnchorElement>);
    }
  }

  if (popunderEligible) {
    const { type: _type, ...buttonRest } = rest as ComponentPropsWithoutRef<"button">;
    return (
      <button
        type="button"
        className={className}
        onClick={handleClick}
        {...buttonRest}
      >
        {children}
      </button>
    );
  }

  return (
    <a className={className} href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
