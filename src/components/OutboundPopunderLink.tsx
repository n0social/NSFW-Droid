"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useMemo } from "react";
import { shouldShowPlayPopunder } from "@/lib/ads-config";
import {
  firePopunderThenOpenNewTab,
  openOutboundInNewTab,
} from "@/lib/exoclick-play-popunder-client";
import { urlEligibleForOutboundPopunder } from "@/lib/outbound-link";

type AnchorProps = ComponentPropsWithoutRef<"a">;

type Props = Omit<AnchorProps, "href"> & {
  href: string;
  ageVerified: boolean;
  /** When false, never run popunder. */
  monetize?: boolean;
  /** Default: true when `target="_blank"`. */
  openInNewTab?: boolean;
};

function absoluteOutboundHref(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (typeof window !== "undefined") {
    return new URL(href, window.location.origin).href;
  }
  return href;
}

/**
 * External outbound anchor. Popunder: one visible new tab + ExoClick fetch (no iframe).
 */
export function OutboundPopunderLink({
  ageVerified,
  monetize = true,
  openInNewTab: _openInNewTab,
  target,
  href,
  className,
  onClick,
  children,
  ...rest
}: Props) {
  const popunderEligible = monetize && shouldShowPlayPopunder(ageVerified);

  const monetizedOutbound = useMemo(() => {
    if (!popunderEligible) return false;
    try {
      return urlEligibleForOutboundPopunder(absoluteOutboundHref(href));
    } catch {
      return false;
    }
  }, [popunderEligible, href]);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (monetizedOutbound) {
      e.preventDefault();
      e.stopPropagation();
      const destHref = e.currentTarget.href;
      if (!firePopunderThenOpenNewTab(destHref)) {
        openOutboundInNewTab(destHref);
      }
      onClick?.(e);
      return;
    }
    onClick?.(e);
  }

  return (
    <a className={className} href={href} target={target} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
