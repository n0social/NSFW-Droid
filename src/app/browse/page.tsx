import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BrowseCatalog } from "@/components/BrowseCatalog";
import { browseCatalogPath } from "@/lib/browse-catalog-path";
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
import { browseTagHubIntro } from "@/lib/browse-tag-intro";
import { CATALOG_PAGE_REVALIDATE_SECONDS } from "@/lib/catalog-revalidate";
import { getSessionUserId } from "@/lib/user-session";

export const revalidate = CATALOG_PAGE_REVALIDATE_SECONDS;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramOne(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function browseFiltersFromSearchParams(sp: Record<string, string | string[] | undefined>) {
  const rail = paramOne(sp.rail);
  const tag = paramOne(sp.tag);
  const q = paramOne(sp.q);
  const vanilla = paramOne(sp.vanilla) === "1";
  const sort = paramOne(sp.sort);
  const pageRaw = paramOne(sp.page);
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);
  return { rail, tag, q, vanilla, sort, page };
}

<<<<<<< HEAD
=======
function browseListingsRail(rail: string | null) {
  return rail === "new" || rail === "hot" || rail === "trending"
    ? rail === "hot"
      ? "new"
      : rail
    : null;
}

function browseCatalogSort(sort: string | null) {
  return sort === "new" ? "new" : null;
}

>>>>>>> origin/cursor/seo-browse-pagination-rel-4fae
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const { rail, tag, q, vanilla, sort, page } = browseFiltersFromSearchParams(sp);
<<<<<<< HEAD
=======
  const catalogSort = browseCatalogSort(sort);
>>>>>>> origin/cursor/seo-browse-pagination-rel-4fae

  const path = browseCatalogPath({
    rail,
    tag,
    q,
    vanilla,
<<<<<<< HEAD
    sort: sort === "new" ? "new" : null,
=======
    sort: catalogSort,
>>>>>>> origin/cursor/seo-browse-pagination-rel-4fae
    page,
  });

  const browse = await getBrowseListings({
<<<<<<< HEAD
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
=======
    rail: browseListingsRail(rail),
    tag,
    q,
    vanilla,
    sort: catalogSort,
>>>>>>> origin/cursor/seo-browse-pagination-rel-4fae
    page,
  });

  const title = page > 1 ? `Browse · Page ${page}` : "Browse";
  const metadata: Metadata = {
    title,
    alternates: { canonical: path },
  };

  const railBlocksPagination =
    rail === "new" || rail === "hot" || rail === "trending";
  if (!railBlocksPagination && browse.total > 0) {
    const totalPages = Math.max(1, Math.ceil(browse.total / BROWSE_PAGE_SIZE));
    const paginationLinks: { rel: string; url: string }[] = [];
<<<<<<< HEAD
    if (page > 1) {
      paginationLinks.push({
        rel: "prev",
        url: browseCatalogPath({
          rail,
          tag,
          q,
          vanilla,
          sort: sort === "new" ? "new" : null,
          page: page - 1,
        }),
=======
    const linkBase = { rail, tag, q, vanilla, sort: catalogSort };
    if (page > 1) {
      paginationLinks.push({
        rel: "prev",
        url: browseCatalogPath({ ...linkBase, page: page - 1 }),
>>>>>>> origin/cursor/seo-browse-pagination-rel-4fae
      });
    }
    if (page < totalPages) {
      paginationLinks.push({
        rel: "next",
<<<<<<< HEAD
        url: browseCatalogPath({
          rail,
          tag,
          q,
          vanilla,
          sort: sort === "new" ? "new" : null,
          page: page + 1,
        }),
=======
        url: browseCatalogPath({ ...linkBase, page: page + 1 }),
>>>>>>> origin/cursor/seo-browse-pagination-rel-4fae
      });
    }
    if (paginationLinks.length > 0) {
      metadata.icons = { other: paginationLinks };
    }
  }

  return metadata;
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { rail, tag, q, vanilla, sort, page } = browseFiltersFromSearchParams(sp);
<<<<<<< HEAD
=======
  const catalogSort = browseCatalogSort(sort);
>>>>>>> origin/cursor/seo-browse-pagination-rel-4fae

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
    rail: browseListingsRail(rail),
    tag,
    q,
    vanilla,
    sort: catalogSort,
    page,
  });

  const listingCount = browse.catalogUnavailable ? 0 : await getPublishedListingCount();

  const tagHubIntro =
    tag && !browse.catalogUnavailable
      ? browseTagHubIntro(
          browse.tags.find((t) => t.slug === tag.trim().toLowerCase())?.label ?? tag,
          browse.total,
        )
      : null;

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
        initialSort={catalogSort}
        totalListings={browse.total}
        page={page}
        pageSize={BROWSE_PAGE_SIZE}
        tagHubIntro={tagHubIntro}
      />
    </div>
  );
}
