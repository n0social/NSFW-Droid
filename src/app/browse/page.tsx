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
import { getSessionUserId } from "@/lib/user-session";

/** Keep in sync with `CATALOG_PAGE_REVALIDATE_SECONDS` (Next.js requires a literal). */
export const revalidate = 3600;

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

function appendBrowsePaginationLinks(
  metadata: Metadata,
  input: {
    rail: string | null;
    tag: string | null;
    q: string | null;
    vanilla: boolean;
    sort: string | null;
    page: number;
    total: number;
  },
): void {
  const catalogSort = browseCatalogSort(input.sort);
  const railBlocksPagination =
    input.rail === "new" || input.rail === "hot" || input.rail === "trending";
  if (railBlocksPagination || input.total <= 0) return;

  const totalPages = Math.max(1, Math.ceil(input.total / BROWSE_PAGE_SIZE));
  const paginationLinks: { rel: string; url: string }[] = [];
  const linkBase = {
    rail: input.rail,
    tag: input.tag,
    q: input.q,
    vanilla: input.vanilla,
    sort: catalogSort,
  };
  if (input.page > 1) {
    paginationLinks.push({
      rel: "prev",
      url: browseCatalogPath({ ...linkBase, page: input.page - 1 }),
    });
  }
  if (input.page < totalPages) {
    paginationLinks.push({
      rel: "next",
      url: browseCatalogPath({ ...linkBase, page: input.page + 1 }),
    });
  }
  if (paginationLinks.length > 0) {
    metadata.icons = { other: paginationLinks };
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const { rail, tag, q, vanilla, sort, page } = browseFiltersFromSearchParams(sp);
  const catalogSort = browseCatalogSort(sort);
  const tagSlug = tag?.trim().toLowerCase() || null;
  const tagOnlyHub = Boolean(tagSlug && !rail && !q && !vanilla && !catalogSort);

  const path = browseCatalogPath({
    rail,
    tag,
    q,
    vanilla,
    sort: catalogSort,
    page,
  });

  const browse = await getBrowseListings({
    rail: browseListingsRail(rail),
    tag,
    q,
    vanilla,
    sort: catalogSort,
    page,
  });

  if (tagOnlyHub && tagSlug && page === 1) {
    const label = browse.tags.find((t) => t.slug === tagSlug)?.label ?? tag;
    const description = browseTagHubIntro(label ?? tagSlug, browse.total);
    const metadata: Metadata = {
      title: `${label} · Browse`,
      description,
      alternates: { canonical: path },
      openGraph: {
        title: `${label} · Browse`,
        description,
        url: path,
        type: "website",
      },
    };
    appendBrowsePaginationLinks(metadata, {
      rail,
      tag,
      q,
      vanilla,
      sort,
      page,
      total: browse.total,
    });
    return metadata;
  }

  const title = page > 1 ? `Browse · Page ${page}` : "Browse";
  const metadata: Metadata = {
    title,
    alternates: { canonical: path },
  };
  appendBrowsePaginationLinks(metadata, {
    rail,
    tag,
    q,
    vanilla,
    sort,
    page,
    total: browse.total,
  });

  return metadata;
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { rail, tag, q, vanilla, sort, page } = browseFiltersFromSearchParams(sp);
  const catalogSort = browseCatalogSort(sort);

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
    tag && page === 1 && !browse.catalogUnavailable
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
