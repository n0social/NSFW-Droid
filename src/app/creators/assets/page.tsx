import type { Metadata } from "next";
import { CreatorAssetsHubPage } from "@/components/CreatorAssetsHubPage";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";
import { getPublishedListingCount } from "@/lib/listings";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";
import { resolveLayoutDecorForTheme } from "@/lib/themes/layout-decor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creator assets",
  description:
    "Curated outbound links to NSFW sound effects, moan libraries, and SFMLab audio for adult game and SFM creators.",
};

export default async function CreatorAssetsRoutePage() {
  const ageVerified = await isAgeVerifiedRequest();

  const { active } = await resolveThemeForRequest();
  const themeAssets = themeDecorUrls(active.id);
  const layoutDecor = resolveLayoutDecorForTheme(active);

  const listingCount = await getPublishedListingCount();

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CreatorAssetsHubPage
        layoutDecor={layoutDecor}
        ageVerified={ageVerified}
        listingCount={listingCount}
        themeAssets={themeAssets}
      />
    </div>
  );
}
