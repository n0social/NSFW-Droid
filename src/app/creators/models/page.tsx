import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CreatorModelsPage } from "@/components/CreatorModelsPage";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";
import { BLUR_COVERS_COOKIE, parseBlurCovers } from "@/lib/cookies";
import { getPublishedListingCount } from "@/lib/listings";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";
import { resolveLayoutDecorForTheme } from "@/lib/themes/layout-decor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Top SFM models",
  description:
    "Curated top NSFW Source Filmmaker models with direct SmutBase links. NSFW Droid does not host model files.",
};

export default async function CreatorModelsRoutePage() {
  const jar = await cookies();
  const ageVerified = await isAgeVerifiedRequest();
  const blurCovers = parseBlurCovers(jar.get(BLUR_COVERS_COOKIE)?.value);

  const { active } = await resolveThemeForRequest();
  const themeAssets = themeDecorUrls(active.id);
  const layoutDecor = resolveLayoutDecorForTheme(active);

  const listingCount = await getPublishedListingCount();

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CreatorModelsPage
        layoutDecor={layoutDecor}
        ageVerified={ageVerified}
        blurCovers={blurCovers}
        listingCount={listingCount}
        themeAssets={themeAssets}
      />
    </div>
  );
}
