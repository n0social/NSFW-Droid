"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useEffect, useState } from "react";
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

/**
 * External outbound anchor. Popunder: one visible new tab + ad in hidden iframe (keeps card layout).
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
  const [monetizedOutbound, setMonetizedOutbound] = useState(false);

  useEffect(() => {
    if (!popunderEligible) {
      setMonetizedOutbound(false);
      return;
    }
    try {
      const full = new URL(href, window.location.origin).href;
      setMonetizedOutbound(urlEligibleForOutboundPopunder(full));
    } catch {
      setMonetizedOutbound(false);
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
