import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CreatorsPage } from "@/components/CreatorsPage";
import { AGE_VERIFIED_COOKIE, parseAgeVerified } from "@/lib/cookies";
import { getPublishedListingCount } from "@/lib/listings";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";
import { resolveLayoutDecorForTheme } from "@/lib/themes/layout-decor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creators",
  description:
    "Curated outbound links to top adult game studios and notable NSFW titles on Steam, itch.io, Nutaku, and official sites. NSFW Droid does not host these games.",
};

export default async function CreatorsRoutePage() {
  const jar = await cookies();
  const ageVerified = parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value);

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
