/** Tag chibi. The flag is hot pink to gold so it stays bright on dark covers. */
export const SALE_STANDEE_SRC = "/shop/nsfw-droid-shop-vesper-chibi-sale-flag-standee.png";

/** Badge percent for a listing. Hides a sale after saleEndsAt. */
export function activeSalePercent(
  listing: { salePercent?: number | null; saleEndsAt?: Date | string | null },
  now = Date.now(),
): number | null {
  const percent = listing.salePercent;
  if (percent == null || !Number.isInteger(percent) || percent <= 0 || percent > 100) return null;
  if (listing.saleEndsAt) {
    const ends = new Date(listing.saleEndsAt).getTime();
    if (Number.isFinite(ends) && ends <= now) return null;
  }
  return percent;
}
