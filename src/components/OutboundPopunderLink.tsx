"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useMemo } from "react";
import { shouldShowPlayPopunder } from "@/lib/ads-config";
import { urlEligibleForOutboundPopunder } from "@/lib/outbound-link";
import { outboundPlayLinkClassName } from "@/lib/outbound-play-link";

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
 * External outbound anchor. Eligible non-Steam links carry `nsfwdroid-play-outbound`
 * so ExoClick's class-trigger popunder can count the click. The anchor is a normal
 * navigation. Steam URLs omit the class.
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

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
  }

  const linkTarget = monetizedOutbound
    ? undefined
    : target ?? (openInNewTab ? "_blank" : undefined);

  return (
    <a
      className={monetizedOutbound ? outboundPlayLinkClassName(className) : className}
      href={href}
      target={linkTarget}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
