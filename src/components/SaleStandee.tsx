import { SALE_STANDEE_SRC } from "@/lib/sale-badge";

const SIZES = {
  rail: "h-20",
  grid: "h-24",
  detail: "h-28 sm:h-36",
} as const;

/** SALE chibi in the bottom-right corner of a listing that the daily scan marked on sale. */
export function SaleStandee({ size = "rail" }: { size?: keyof typeof SIZES }) {
  return (
    <span className={`pointer-events-none absolute bottom-0 right-0 z-30 block ${SIZES[size]}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SALE_STANDEE_SRC}
        alt=""
        className="h-full w-auto max-w-none object-contain object-bottom drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
      />
      <span className="sr-only">On sale</span>
    </span>
  );
}
