"use client";

import type { ComponentPropsWithoutRef } from "react";
import { shouldShowPlayPopunder } from "@/lib/ads-config";
import { outboundPlayLinkClassName } from "@/lib/outbound-play-link";

type Props = ComponentPropsWithoutRef<"a"> & {
  /** When false, never attach the ExoClick popunder trigger class (e.g. fallback links). */
  monetize?: boolean;
  ageVerified: boolean;
};

/**
 * Outbound store CTA. Keeps a normal `/api/go/…` navigation; ExoClick popunder
 * (when configured) hooks the same click via trigger class on the anchor.
 */
export function OutboundPlayLink({
  monetize = true,
  ageVerified,
  className,
  children,
  ...rest
}: Props) {
  const triggerPopunder = monetize && shouldShowPlayPopunder(ageVerified);
  const mergedClass = triggerPopunder ? outboundPlayLinkClassName(className) : className;

  return (
    <a className={mergedClass} {...rest}>
      {children}
    </a>
  );
}
