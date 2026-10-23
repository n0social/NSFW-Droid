"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useMemo } from "react";
import { shouldShowPlayPopunder } from "@/lib/ads-config";
import { urlEligibleForOutboundPopunder } from "@/lib/outbound-link";

type AnchorProps = ComponentPropsWithoutRef<"a">;

type Props = Omit<AnchorProps, "href"> & {
  href: string;
  ageVerified: boolean;
  /** When false, never run popunder. */
  monetize?: boolean;
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
 * External outbound link. Monetized: same-tab `/api/outbound?u=…` (interstitial + ExoClick).
 */
export function OutboundPopunderLink({
  ageVerified,
  monetize = true,
  openInNewTab,
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

  const linkHref = monetizedOutbound
    ? `/api/outbound?u=${encodeURIComponent(absoluteOutboundHref(href))}`
    : href;

  const linkTarget = monetizedOutbound ? undefined : target ?? (openInNewTab ? "_blank" : undefined);

  return (
    <a
      className={className}
      href={linkHref}
      target={linkTarget}
      onClick={onClick}
      {...rest}
    >
      {children}
    </a>
  );
}
