import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BrowseCatalog } from "@/components/BrowseCatalog";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";
import { BLUR_COVERS_COOKIE, parseBlurCovers } from "@/lib/cookies";
import { BROWSE_PAGE_SIZE } from "@/lib/browse-constants";
import { getBrowseListings } from "@/lib/browse-listings";
import { getPublishedListingCount } from "@/lib/listings";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";
import { resolveLayoutDecorForTheme } from "@/lib/themes/layout-decor";
import {
  browseHasValues,
  browsePrefsFromUserPreferences,
  browsePrefsToQueryString,
} from "@/lib/browse-preferences";
import { getUserProfile, parseUserPreferences } from "@/lib/user-profile";
import { getSessionUserId } from "@/lib/user-session";

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
  const sort = paramOne(sp.sort);
  const pageRaw = paramOne(sp.page);
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);

  const hasUrlFilters = Boolean(
    (rail === "new" || rail === "hot" || rail === "trending") ||
      tag ||
      q ||
      vanilla ||
      sort === "new",
  );
  if (!hasUrlFilters) {
    const uid = await getSessionUserId();
    if (uid) {
      const profile = await getUserProfile(uid);
      const saved = browsePrefsFromUserPreferences(parseUserPreferences(profile?.preferences));
      if (saved && browseHasValues(saved)) {
        const qs = browsePrefsToQueryString(saved);
        redirect(qs ? `/browse?${qs}` : "/browse");
      }
    }
  }

  const jar = await cookies();
  const ageVerified = await isAgeVerifiedRequest();
  const blurCovers = parseBlurCovers(jar.get(BLUR_COVERS_COOKIE)?.value);

  const { active } = await resolveThemeForRequest();
  const themeAssets = themeDecorUrls(active.id);
  const layoutDecor = resolveLayoutDecorForTheme(active);

  const browse = await getBrowseListings({
    rail:
      rail === "new" || rail === "hot" || rail === "trending"
        ? rail === "hot"
          ? "new"
          : rail
        : null,
    tag,
    q,
    vanilla,
    sort: sort === "new" ? "new" : null,
    page,
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
        initialSort={sort === "new" ? "new" : null}
        totalListings={browse.total}
        page={page}
        pageSize={BROWSE_PAGE_SIZE}
      />
    </div>
  );
}
