"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { shouldShowPlayPopunder } from "@/lib/ads-config";
import {
  firePopunderThenOpenNewTab,
  openOutboundInNewTab,
} from "@/lib/exoclick-play-popunder-client";
import { urlEligibleForOutboundPopunder } from "@/lib/outbound-link";

type Props = ComponentPropsWithoutRef<"a"> & {
  ageVerified: boolean;
  /** When false, never run popunder. */
  monetize?: boolean;
  /** Default: true when `target="_blank"`. */
  openInNewTab?: boolean;
};

/**
 * External or `/api/go/` outbound anchor with optional ExoClick popunder (non-Steam only).
 */
export function OutboundPopunderLink({
  ageVerified,
  monetize = true,
  openInNewTab,
  target,
  className,
  onClick,
  children,
  ...rest
}: Props) {
  const newTab = openInNewTab ?? target === "_blank";
  const popunderEligible = monetize && shouldShowPlayPopunder(ageVerified);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (popunderEligible) {
      const href = e.currentTarget.href;
      if (urlEligibleForOutboundPopunder(href)) {
        e.preventDefault();
        if (!firePopunderThenOpenNewTab(href)) {
          openOutboundInNewTab(href);
        }
        onClick?.(e);
        return;
      }
    }
    onClick?.(e);
  }

  return (
    <a className={className} target={target} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
