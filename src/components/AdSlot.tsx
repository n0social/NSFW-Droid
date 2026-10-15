type Placement = "below-hero" | "between-rails" | "footer-band";

type Props = {
  placement: Placement;
  /** Ads must not render before age verification (see docs/revenue_streams.md). */
  ageVerified: boolean;
};

const PLACEHOLDER_MIN_H: Record<Placement, string> = {
  "below-hero": "min-h-[90px]",
  "between-rails": "min-h-[72px]",
  "footer-band": "min-h-[100px]",
};

function adsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADS_ENABLED === "1";
}

/**
 * Reserved ad surface — no third-party network scripts until explicitly wired.
 * Set NEXT_PUBLIC_ADS_ENABLED=1 only after age gate + network approval.
 */
export function AdSlot({ placement, ageVerified }: Props) {
  if (!adsEnabled() || !ageVerified) {
    return null;
  }

  return (
    <div
      data-ad-slot={placement}
      aria-hidden
      className={`mx-auto my-4 w-full max-w-7xl rounded-xl border border-dashed border-[#C026D3]/25 bg-[#241033]/40 ${PLACEHOLDER_MIN_H[placement]}`}
    />
  );
}
