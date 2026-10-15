"use client";

import {
  type AdPlacement,
  exoclickInsClass,
  isAdsEnabled,
  zoneIdForPlacement,
} from "@/lib/ads-config";
type Props = {
  placement: AdPlacement;
  /** Ads must not render before age verification (`age_verified` cookie). */
  ageVerified: boolean;
};

const SLOT_MIN_H: Record<AdPlacement, string> = {
  "below-hero": "min-h-[90px]",
  "between-rails": "min-h-[72px]",
  "browse-inline": "min-h-[72px]",
};

const SKIP_LABEL: Record<AdPlacement, string> = {
  "below-hero": "Skip sponsored content below hero",
  "between-rails": "Skip sponsored content between rails",
  "browse-inline": "Skip sponsored content in catalog",
};

function AdSkipLink({ placement }: { placement: AdPlacement }) {
  const target = `ad-slot-${placement}`;
  return (
    <a
      href={`#${target}`}
      className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)] focus:static focus:z-50 focus:m-2 focus:h-auto focus:w-auto focus:overflow-visible focus:rounded focus:bg-[#241033] focus:px-3 focus:py-2 focus:text-xs focus:font-bold focus:text-[#FF4D8D] focus:[clip:auto]"
    >
      {SKIP_LABEL[placement]}
    </a>
  );
}

/**
 * Reserved ad surface. With `NEXT_PUBLIC_ADS_ENABLED=0` (default), renders nothing.
 * When enabled + age-verified + ExoClick env set, loads the network script and zone tags.
 */
export function AdSlot({ placement, ageVerified }: Props) {
  const enabled = isAdsEnabled();
  const zoneId = zoneIdForPlacement(placement);
  const insClass = exoclickInsClass();

  if (!enabled) {
    return null;
  }

  if (!ageVerified) {
    return null;
  }

  const slotId = `ad-slot-${placement}`;

  if (!zoneId) {
    return (
      <div
        id={slotId}
        data-ad-slot={placement}
        aria-hidden
        className={`relative mx-auto my-4 w-full max-w-7xl rounded-xl border border-dashed border-[#C026D3]/25 bg-[#241033]/40 ${SLOT_MIN_H[placement]}`}
      />
    );
  }

  return (
    <aside
      id={slotId}
      data-ad-slot={placement}
      aria-label="Sponsored"
      className={`relative mx-auto my-4 w-full max-w-7xl ${SLOT_MIN_H[placement]}`}
    >
      <AdSkipLink placement={placement} />
      <ins
        className={insClass ?? undefined}
        data-zoneid={zoneId}
        data-ad-slot={placement}
      />
    </aside>
  );
}
