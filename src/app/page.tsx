import { cookies } from "next/headers";
import { Storefront } from "@/components/Storefront";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";
import { BLUR_COVERS_COOKIE, parseBlurCovers } from "@/lib/cookies";
import { getListingsForStorefront, getPublishedListingCount } from "@/lib/listings";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";
import { resolveLayoutDecorForTheme } from "@/lib/themes/layout-decor";
import { getRecentVideos, hasEnabledVideoFeeds } from "@/lib/video-feeds";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const jar = await cookies();
  const ageVerified = await isAgeVerifiedRequest();
  const blurCovers = parseBlurCovers(jar.get(BLUR_COVERS_COOKIE)?.value);

  const { active } = await resolveThemeForRequest();
  const themeAssets = themeDecorUrls(active.id);
  const layoutDecor = resolveLayoutDecorForTheme(active);

  const storefront = await getListingsForStorefront();
  const listingCount = storefront.catalogUnavailable
    ? 0
    : await getPublishedListingCount();

  const recentVideos =
    hasEnabledVideoFeeds() ? (await getRecentVideos(8)).items : [];

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Storefront
        layoutDecor={layoutDecor}
        ageVerified={ageVerified}
        blurCovers={blurCovers}
        topGrossing={storefront.topGrossing}
        featured={storefront.featured}
        newReleases={storefront.newReleases}
        recentVideos={recentVideos}
        rankingsFromAnalytics={storefront.rankingsFromAnalytics}
        all={storefront.all}
        listingCount={listingCount}
        catalogUnavailable={storefront.catalogUnavailable}
        themeAssets={themeAssets}
      />
    </div>
  );
}
