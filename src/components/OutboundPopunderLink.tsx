"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { shouldShowPlayPopunder } from "@/lib/ads-config";
import {
  firePopunderThenOpenNewTab,
  openOutboundInNewTab,
  prefetchPopunderAdUrl,
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
 * External or `/api/go/` outbound control with optional ExoClick popunder (non-Steam only).
 * Uses a button when popunder applies so outbound `<a href>` is not double-opened by ad tags.
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
  const [useButton, setUseButton] = useState(false);
  const [prefetchedAdUrl, setPrefetchedAdUrl] = useState<string | null>(null);
  const prefetchStarted = useRef(false);

  useEffect(() => {
    if (!popunderEligible) {
      setUseButton(false);
      return;
    }
    try {
      const full = new URL(href, window.location.origin).href;
      setUseButton(urlEligibleForOutboundPopunder(full));
    } catch {
      setUseButton(false);
    }
  }, [popunderEligible, href]);

  useEffect(() => {
    if (!useButton || prefetchStarted.current) return;
    prefetchStarted.current = true;
    void prefetchPopunderAdUrl().then(setPrefetchedAdUrl);
  }, [useButton]);

  async function runPopunderOutbound(destHref: string) {
    let adUrl = prefetchedAdUrl;
    if (!adUrl) {
      adUrl = await prefetchPopunderAdUrl();
      setPrefetchedAdUrl(adUrl);
    }
    if (!firePopunderThenOpenNewTab(destHref, { prefetchedAdUrl: adUrl })) {
      openOutboundInNewTab(destHref);
    }
  }

  function handleClick(e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    if (useButton) {
      e.preventDefault();
      e.stopPropagation();
      const destHref =
        e.currentTarget instanceof HTMLAnchorElement
          ? e.currentTarget.href
          : new URL(href, window.location.origin).href;
      void runPopunderOutbound(destHref);
      onClick?.(e as MouseEvent<HTMLAnchorElement>);
      return;
    }
    onClick?.(e as MouseEvent<HTMLAnchorElement>);
  }

  if (useButton) {
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
    <a className={className} href={href} target={target} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
