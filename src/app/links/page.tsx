import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CommunityLinksPage } from "@/components/CommunityLinksPage";
import { AGE_VERIFIED_COOKIE, parseAgeVerified } from "@/lib/cookies";
import { getPublishedListingCount } from "@/lib/listings";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";
import { resolveLayoutDecorForTheme } from "@/lib/themes/layout-decor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community links",
  description:
    "Curated outbound links to NSFW game catalogs, communities, and major animated, hentai, and SFM hubs. NSFW Droid does not host third-party content.",
};

export default async function CommunityLinksRoutePage() {
  const jar = await cookies();
  const ageVerified = parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value);

  const { active } = await resolveThemeForRequest();
  const themeAssets = themeDecorUrls(active.id);
  const layoutDecor = resolveLayoutDecorForTheme(active);

  const listingCount = await getPublishedListingCount();

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CommunityLinksPage
        layoutDecor={layoutDecor}
        ageVerified={ageVerified}
        listingCount={listingCount}
        themeAssets={themeAssets}
      />
    </div>
  );
}
