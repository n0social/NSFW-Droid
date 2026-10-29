import { CreatorsPage } from "@/components/CreatorsPage";
import { hubPageMetadata } from "@/lib/hub-page-metadata";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";
import { getPublishedListingCount } from "@/lib/listings";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";
import { resolveLayoutDecorForTheme } from "@/lib/themes/layout-decor";

export const dynamic = "force-dynamic";

export const metadata = hubPageMetadata(
  "/creators",
  "Creators",
  "Curated outbound links to top adult game studios and notable NSFW titles on Steam, itch.io, Nutaku, and official sites. NSFW Droid does not host these games.",
);

export default async function CreatorsRoutePage() {
  const ageVerified = await isAgeVerifiedRequest();

  const { active } = await resolveThemeForRequest();
  const themeAssets = themeDecorUrls(active.id);
  const layoutDecor = resolveLayoutDecorForTheme(active);

  const listingCount = await getPublishedListingCount();

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CreatorsPage
        layoutDecor={layoutDecor}
        ageVerified={ageVerified}
        listingCount={listingCount}
        themeAssets={themeAssets}
      />
    </div>
  );
}
