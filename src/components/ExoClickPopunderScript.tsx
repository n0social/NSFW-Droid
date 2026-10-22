"use client";

import Script from "next/script";
import {
  exoclickPopunderScriptSrc,
  exoclickPopunderZoneId,
  exoclickPopunderZoneIdMobile,
  shouldShowPlayPopunder,
} from "@/lib/ads-config";

type Props = {
  ageVerified: boolean;
};

/**
 * Loads ExoClick's popunder loader once per document. Play links use
 * {@link EXOCLICK_PLAY_OUTBOUND_TRIGGER_CLASS} so only store CTAs fire the zone.
 */
export function ExoClickPopunderScript({ ageVerified }: Props) {
  const live = shouldShowPlayPopunder(ageVerified);
  const src = live ? exoclickPopunderScriptSrc() : undefined;
  if (!live || !src) return null;

  const zoneDesktop = exoclickPopunderZoneId() ?? "6062592";
  const zoneMobile = exoclickPopunderZoneIdMobile() ?? "6062594";

  return (
    <Script
      id="exoclick-popunder-loader"
      src={src}
      strategy="afterInteractive"
      data-zone-desktop={zoneDesktop}
      data-zone-mobile={zoneMobile}
    />
  );
}
