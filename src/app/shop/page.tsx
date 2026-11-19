import type { Metadata } from "next";
import { ShopPage } from "@/components/shop/ShopPage";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";
import { getPublishedListingCount } from "@/lib/listings";

export const dynamic = "force-dynamic";

/** Cautious launch: owner can flip to index when shop checkout is ready. */
export const metadata: Metadata = {
  title: "Shop",
  description:
    "Official NSFW Droid merch preview — stickers, wear, and digital packs. Cart and checkout coming in a later pass.",
  robots: { index: false, follow: false },
};

export default async function ShopRoutePage() {
  const ageVerified = await isAgeVerifiedRequest();
  const listingCount = await getPublishedListingCount();

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <ShopPage ageVerified={ageVerified} listingCount={listingCount} />
    </div>
  );
}
