import { cookies } from "next/headers";
import { Storefront } from "@/components/Storefront";
import {
  AGE_VERIFIED_COOKIE,
  BLUR_COVERS_COOKIE,
  parseAgeVerified,
  parseBlurCovers,
} from "@/lib/cookies";
import { getListingsForStorefront, getPublishedListingCount } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const jar = await cookies();
  const ageVerified = parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value);
  const blurCovers = parseBlurCovers(jar.get(BLUR_COVERS_COOKIE)?.value);

  const storefront = await getListingsForStorefront();
  const listingCount = storefront.catalogUnavailable
    ? 0
    : await getPublishedListingCount();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Storefront
        ageVerified={ageVerified}
        blurCovers={blurCovers}
        topGrossing={storefront.topGrossing}
        newReleases={storefront.newReleases}
        rankingsFromAnalytics={storefront.rankingsFromAnalytics}
        all={storefront.all}
        listingCount={listingCount}
        catalogUnavailable={storefront.catalogUnavailable}
      />
    </div>
  );
}
