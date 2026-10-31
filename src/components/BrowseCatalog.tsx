"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { browseCatalogPath } from "@/lib/browse-catalog-path";
import { browsePrefsFromSearchParams } from "@/lib/browse-preferences";
import type { Listing, Tag } from "@/db/schema";
import { GameCard } from "@/components/GameCard";
import { AgeGate } from "@/components/AgeGate";
import { VesperWelcomeCard } from "@/components/VesperWelcomeCard";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import type { ResolvedLayoutDecorItem } from "@/lib/themes/types";
import { ThemeLayoutDecor } from "@/components/theme/ThemeLayoutDecor";
import { browsePlatformHubMeta, normalizeBrowsePlatformSlug } from "@/lib/browse-platforms";
import { isNsfwBrowseCatalogTag } from "@/lib/tag-filter";
import { BROWSE_PAGE_SIZE } from "@/lib/browse-constants";
import { effectiveCoverBlur } from "@/lib/cover-blur";

type Props = {
  ageVerified: boolean;
  blurCovers: boolean;
  listings: Listing[];
  tags: Tag[];
  listingCount: number;
  catalogUnavailable?: boolean;
  themeAssets?: ThemeDecorFiles | null;
  layoutDecor?: ResolvedLayoutDecorItem[];
  initialRail?: string | null;
  initialTag?: string | null;
  initialVanilla?: boolean;
  initialQ?: string | null;
  initialSort?: "new" | null;
  totalListings?: number;
  page?: number;
  pageSize?: number;
  hubIntro?: string | null;
  initialPlatform?: string | null;
};

export function BrowseCatalog({
  ageVerified,
  blurCovers,
  listings,
  tags,
  listingCount,
  catalogUnavailable = false,
  themeAssets = null,
  layoutDecor = [],
  initialRail = null,
  initialTag = null,
  initialVanilla = false,
  initialQ = null,
  initialSort = null,
  totalListings = 0,
  page = 1,
  pageSize = BROWSE_PAGE_SIZE,
  hubIntro = null,
  initialPlatform = null,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState(initialQ ?? "");

  const effectiveBlur = effectiveCoverBlur(ageVerified, blurCovers);

  const filterValue = useMemo(() => {
    if (initialVanilla) return "vanilla";
    if (initialTag) return `tag:${initialTag}`;
    if (initialRail === "new" || initialRail === "hot") return "rail:new";
    if (initialRail === "trending") return "rail:trending";
    return "all";
  }, [initialRail, initialTag, initialVanilla]);

  const title = useMemo(() => {
    if (initialRail === "new" || initialRail === "hot") return "Newest additions";
    if (initialRail === "trending") return "Trending now";
    if (initialVanilla) return "Vanilla NSFW catalog";
    if (initialTag) {
      const label = tags.find((t) => t.slug === initialTag)?.label ?? initialTag;
      return `Tag: ${label}`;
    }
    if (initialPlatform) {
      const slug = normalizeBrowsePlatformSlug(initialPlatform);
      const meta = slug ? browsePlatformHubMeta(slug) : null;
      return meta?.seoTitle ?? `Platform: ${initialPlatform}`;
    }
    if (initialSort === "new") return "New in the last 30 days";
    if (initialQ) return `Search: ${initialQ}`;
    return "Browse catalog";
  }, [initialRail, initialTag, initialPlatform, initialVanilla, initialQ, initialSort, tags]);

  const persistBrowsePrefs = useCallback(
    async (filter: string, search: string) => {
      if (!user) return;
      let rail: string | null = null;
      let tag: string | null = null;
      let vanilla = false;
      if (filter === "vanilla") vanilla = true;
      else if (filter.startsWith("tag:")) tag = filter.slice(4);
      else if (filter === "rail:new") rail = "new";
      else if (filter === "rail:trending") rail = "trending";
      const browse = browsePrefsFromSearchParams({
        rail,
        tag,
        q: search || null,
        vanilla,
      });
      await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { browse: browse ?? { vanilla: false } } }),
      });
    },
    [user],
  );

  const applyFilters = useCallback(
    (next: { filter?: string; search?: string }) => {
      const params = new URLSearchParams();
      const filter = next.filter ?? filterValue;
      const search = (next.search ?? q).trim();

      if (filter === "vanilla") params.set("vanilla", "1");
      else if (filter.startsWith("tag:")) params.set("tag", filter.slice(4));
      else if (filter === "rail:new") params.set("rail", "new");
      else if (filter === "rail:trending") params.set("rail", "trending");

      if (search) params.set("q", search);
      if (initialSort === "new" && filter === "all" && !search) params.set("sort", "new");
      const qs = params.toString();
      void persistBrowsePrefs(filter, search);
      router.push(qs ? `/browse?${qs}` : "/browse");
    },
    [filterValue, q, router, persistBrowsePrefs, initialSort],
  );

  const tagOptions = tags.filter(isNsfwBrowseCatalogTag);

  const totalPages = Math.max(1, Math.ceil(totalListings / pageSize));
  const showPagination = totalPages > 1 && !initialRail;
  const rangeStart = totalListings === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalListings);

  function browsePageHref(nextPage: number): string {
    return browseCatalogPath({
      vanilla: initialVanilla,
      tag: initialTag,
      platform: initialPlatform,
      rail: initialRail,
      q: initialQ,
      sort: initialSort === "new" && filterValue === "all" && !initialQ ? "new" : null,
      page: nextPage,
    });
  }

  return (
    <>
      <AgeGate open={!ageVerified} />
      <VesperWelcomeCard ageVerified={ageVerified} />
      <div className={`relative z-[1] ${!ageVerified ? "pointer-events-none select-none" : ""}`}>
        {layoutDecor.length > 0 && <ThemeLayoutDecor items={layoutDecor} />}
        <SiteHeader
          listingCount={listingCount}
          ageVerified={ageVerified}
          themeAssets={themeAssets}
        />

        <main className="mx-auto max-w-7xl px-4 pb-8 pt-4 md:px-6 lg:px-8">
          {catalogUnavailable && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-amber-500/60 bg-amber-950/40 px-4 py-3 text-center text-sm font-semibold text-amber-100"
            >
              Catalog temporarily unavailable — try again shortly.
            </div>
          )}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                href="/"
                className="text-[10px] font-bold uppercase tracking-widest text-[#FF4D8D] hover:underline"
              >
                ← Home
              </Link>
              <h1 className="mt-1 text-xl font-black text-[#FFF1F7] sm:text-2xl">{title}</h1>
              {hubIntro ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#E9D5FF]/90">
                  {hubIntro}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-[#E9D5FF]/80">
                {totalListings > 0
                  ? `${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${totalListings.toLocaleString()} titles`
                  : `${listings.length.toLocaleString()} shown`}
                {showPagination ? ` · page ${page} of ${totalPages}` : ""}
                {" · "}niche tags searchable, not spotlighted on home rails.
              </p>
            </div>

            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters({});
              }}
            >
              <label className="sr-only" htmlFor="browse-filter">Filter</label>
              <select
                id="browse-filter"
                value={filterValue}
                onChange={(e) => applyFilters({ filter: e.target.value })}
                className="min-h-[44px] rounded-xl border border-[var(--theme-primary)]/40 bg-[#241033] px-3 text-sm font-semibold text-[#FFF1F7]"
              >
                <option value="all">All titles</option>
                <option value="vanilla">Vanilla NSFW</option>
                <option value="rail:new">Newest additions</option>
                <option value="rail:trending">Trending now</option>
                {tagOptions.map((t) => (
                  <option key={t.id} value={`tag:${t.slug}`}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title…"
                className="min-h-[44px] min-w-[12rem] flex-1 rounded-xl border border-[var(--theme-primary)]/40 bg-[#241033] px-3 text-sm text-[#FFF1F7] placeholder:text-[#E9D5FF]/50"
              />
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-[var(--theme-accent)] px-4 text-sm font-black text-[var(--foreground)]"
              >
                Search
              </button>
            </form>
          </div>


          {listings.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#E9D5FF]/80">No titles match this filter.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {listings.map((g, i) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    index={i}
                    layout="grid"
                    blur={effectiveBlur}
                    ageVerified={ageVerified}
                    themeAssets={themeAssets}
                  />
                ))}
              </div>
              {showPagination && (
                <nav
                  className="mt-8 flex flex-wrap items-center justify-center gap-3"
                  aria-label="Catalog pages"
                >
                  {page > 1 && (
                    <Link
                      href={browsePageHref(page - 1)}
                      className="min-h-[44px] rounded-xl border border-[var(--theme-primary)]/40 px-4 py-2 text-sm font-bold text-[#FFF1F7] hover:bg-[var(--theme-surface)]"
                    >
                      ← Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={browsePageHref(page + 1)}
                      className="min-h-[44px] rounded-xl bg-[var(--theme-accent)] px-5 py-2 text-sm font-black text-[var(--foreground)] hover:opacity-90"
                    >
                      Next page ({page + 1}/{totalPages})
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </main>
        <SiteFooter ageVerified={ageVerified} />
      </div>
    </>
  );
}
