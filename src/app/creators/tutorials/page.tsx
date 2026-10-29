import { CreatorSfmTutorialsPage } from "@/components/CreatorSfmTutorialsPage";
import { hubPageMetadata } from "@/lib/hub-page-metadata";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";
import { getPublishedListingCount } from "@/lib/listings";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";
import { resolveLayoutDecorForTheme } from "@/lib/themes/layout-decor";

export const dynamic = "force-dynamic";

export const metadata = hubPageMetadata(
  "/creators/tutorials",
  "NSFW SFM tutorials",
  "Curated outbound tutorials for adult Source Filmmaker: install, rigging, lighting, SmutBase/SFMLab, and S2FM.",
);

export default async function CreatorSfmTutorialsRoutePage() {
  const ageVerified = await isAgeVerifiedRequest();
  const { active } = await resolveThemeForRequest();
  const themeAssets = themeDecorUrls(active.id);
  const layoutDecor = resolveLayoutDecorForTheme(active);
  const listingCount = await getPublishedListingCount();

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CreatorSfmTutorialsPage
        ageVerified={ageVerified}
        listingCount={listingCount}
        themeAssets={themeAssets}
        layoutDecor={layoutDecor}
      />
    </div>
  );
}
