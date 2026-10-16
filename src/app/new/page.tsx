import { cookies } from "next/headers";
import { NewArrivalsPage } from "@/components/NewArrivalsPage";
import {
  AGE_VERIFIED_COOKIE,
  BLUR_COVERS_COOKIE,
  parseAgeVerified,
  parseBlurCovers,
} from "@/lib/cookies";
import { getNewArrivalsPageData, getNewListingMaxAgeDays } from "@/lib/new-listings";
import { getPublishedListingCount } from "@/lib/listings";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";
import { resolveLayoutDecorForTheme } from "@/lib/themes/layout-decor";

export const dynamic = "force-dynamic";

export default async function NewPage() {
  const jar = await cookies();
  const ageVerified = parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value);
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
