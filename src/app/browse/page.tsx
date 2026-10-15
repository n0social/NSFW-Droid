import { cookies } from "next/headers";
import { BrowseCatalog } from "@/components/BrowseCatalog";
import {
  AGE_VERIFIED_COOKIE,
  BLUR_COVERS_COOKIE,
  parseAgeVerified,
  parseBlurCovers,
} from "@/lib/cookies";
import { getBrowseListings } from "@/lib/browse-listings";
import { getPublishedListingCount } from "@/lib/listings";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";
import { resolveLayoutDecorForTheme } from "@/lib/themes/layout-decor";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramOne(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const rail = paramOne(sp.rail);
  const tag = paramOne(sp.tag);
  const q = paramOne(sp.q);
  const vanilla = paramOne(sp.vanilla) === "1";

  const jar = await cookies();
  const ageVerified = parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value);
  const blurCovers = parseBlurCovers(jar.get(BLUR_COVERS_COOKIE)?.value);

  const { active } = await resolveThemeForRequest();
  const themeAssets = themeDecorUrls(active.id);
  const layoutDecor = resolveLayoutDecorForTheme(active);

  const browse = await getBrowseListings({
    rail: rail === "hot" || rail === "trending" ? rail : null,
    tag,
    q,
    vanilla,
  });

  const listingCount = browse.catalogUnavailable ? 0 : await getPublishedListingCount();

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <BrowseCatalog
        layoutDecor={layoutDecor}
        ageVerified={ageVerified}
        blurCovers={blurCovers}
        listings={browse.listings}
        tags={browse.tags}
        listingCount={listingCount}
        catalogUnavailable={browse.catalogUnavailable}
        themeAssets={themeAssets}
        initialRail={rail}
        initialTag={tag}
        initialVanilla={vanilla}
        initialQ={q}
      />
    </div>
  );
}
