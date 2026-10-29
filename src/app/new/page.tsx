import type { Metadata } from "next";
import { cookies } from "next/headers";
import { hubPageMetadata } from "@/lib/hub-page-metadata";
import { NewArrivalsPage } from "@/components/NewArrivalsPage";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";
import { BLUR_COVERS_COOKIE, parseBlurCovers } from "@/lib/cookies";
import { getNewArrivalsPageData, getNewListingMaxAgeDays } from "@/lib/new-listings";
import { getPublishedListingCount } from "@/lib/listings";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";
import { resolveLayoutDecorForTheme } from "@/lib/themes/layout-decor";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const days = getNewListingMaxAgeDays();
  return hubPageMetadata(
    "/new",
    "New NSFW games",
    `Adult games published in the last ${days} days, newest first — curated from itch.io, Steam, and partner stores. Outbound links only.`,
  );
}

export default async function NewPage() {
  const jar = await cookies();
  const ageVerified = await isAgeVerifiedRequest();
  const blurCovers = parseBlurCovers(jar.get(BLUR_COVERS_COOKIE)?.value);

  const { active } = await resolveThemeForRequest();
  const themeAssets = themeDecorUrls(active.id);
  const layoutDecor = resolveLayoutDecorForTheme(active);

  const data = await getNewArrivalsPageData();
  const listingCount = data.catalogUnavailable ? 0 : await getPublishedListingCount();

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <NewArrivalsPage
        layoutDecor={layoutDecor}
        ageVerified={ageVerified}
        blurCovers={blurCovers}
        hero={data.hero}
        more={data.more}
        listingCount={listingCount}
        catalogUnavailable={data.catalogUnavailable}
        themeAssets={themeAssets}
        newWindowDays={getNewListingMaxAgeDays()}
      />
    </div>
  );
}
