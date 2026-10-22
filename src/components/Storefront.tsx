"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Listing } from "@/db/schema";
import { GameCard } from "./GameCard";
import { AgeGate } from "./AgeGate";
import { VesperWelcomeCard } from "./VesperWelcomeCard";
import { HeroCarousel } from "./HeroCarousel";
import { ChipRow, type ChipId } from "./ChipRow";
import { SiteHeader } from "./site/SiteHeader";
import { SiteFooter } from "./site/SiteFooter";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import type { ResolvedLayoutDecorItem } from "@/lib/themes/types";
import { ThemeAssetImage } from "@/components/theme/ThemeAssetImage";
import { ThemeLayoutDecor } from "@/components/theme/ThemeLayoutDecor";
import { VideoCard } from "@/components/VideoCard";
import type { VideoFeedItem } from "@/lib/video-feeds";
import { effectiveCoverBlur } from "@/lib/cover-blur";

type Props = {
  ageVerified: boolean;
  blurCovers: boolean;
  themeAssets?: ThemeDecorFiles | null;
  layoutDecor?: ResolvedLayoutDecorItem[];
  topGrossing: Listing[];
  featured: Listing[];
  newReleases: Listing[];
  recentVideos?: VideoFeedItem[];
  all: Listing[];
  listingCount: number;
  rankingsFromAnalytics?: boolean;
  catalogUnavailable?: boolean;
};

function matchesChip(game: Listing, chip: ChipId) {
  if (chip === "all") return true;
  if (chip === "new") return game.chartBucket !== "top_grossing";
  const plats = (game.platforms ?? []).map((p) => p.toLowerCase());
  return plats.includes(chip);
}

export function Storefront({
  ageVerified,
  blurCovers,
  topGrossing,
  featured = [],
  newReleases,
  recentVideos = [],
  all,
  listingCount,
  rankingsFromAnalytics = false,
  catalogUnavailable = false,
  themeAssets = null,
  layoutDecor = [],
}: Props) {
  const pathname = usePathname();
  const [chip, setChip] = useState<ChipId>("all");

  useEffect(() => {
    if (pathname === "/") setChip("all");
  }, [pathname]);

  const effectiveBlur = effectiveCoverBlur(ageVerified, blurCovers);

  const filteredHot = useMemo(
    () => topGrossing.filter((g) => matchesChip(g, chip)),
    [topGrossing, chip],
  );
  const filteredNew = useMemo(
    () => newReleases.filter((g) => matchesChip(g, chip)),
    [newReleases, chip],
  );
  const filteredFeatured = useMemo(
    () => featured.filter((g) => matchesChip(g, chip)),
    [featured, chip],
  );

  const heroFeatured = filteredFeatured[0] ?? null;

  const hotTitle = "Newest additions";
  const newTitle = rankingsFromAnalytics ? "Trending now" : "New releases";

  return (
    <>
      <AgeGate open={!ageVerified} />
      <VesperWelcomeCard ageVerified={ageVerified} />
      <div className={`relative z-[1] ${!ageVerified ? "pointer-events-none select-none" : ""}`}>
        {layoutDecor.length > 0 && (
          <ThemeLayoutDecor
            items={layoutDecor}
            slots={["page-pattern", "corner-bl", "corner-br"]}
          />
        )}
        <SiteHeader
          listingCount={listingCount}
          ageVerified={ageVerified}
          themeAssets={themeAssets}
        />

        <main
          id="storefront"
          className="mx-auto min-w-0 max-w-7xl px-4 pb-4 pt-4 md:px-6 lg:px-8"
        >
          {catalogUnavailable && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-amber-500/60 bg-amber-950/40 px-4 py-3 text-center text-sm font-semibold text-amber-100"
            >
              Catalog temporarily unavailable. Legal pages and site navigation still work — try
              again in a few minutes.
            </div>
          )}

          <HeroCarousel
            featured={heroFeatured}
            blur={effectiveBlur}
            ageVerified={ageVerified}
            layoutDecor={layoutDecor}
          />
          <ChipRow active={chip} onChange={setChip} />

          <hr
            className="mb-8 h-1.5 rounded-full border-0 bg-[var(--theme-primary)]/60 md:h-2"
            aria-hidden={true}
          />

          {catalogUnavailable ? null : listingCount === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--theme-primary)]/50 p-12 text-center">
              {themeAssets && (
                <ThemeAssetImage
                  src={themeAssets.empty}
                  alt=""
                  className="mx-auto mb-4 h-24 w-24 opacity-90"
                />
              )}
              <p className="font-bold text-[var(--theme-text-muted)]">No live listings yet.</p>
              <p className="mt-2 text-xs text-[var(--theme-text-muted)]/80">
                Catalog ingest runs on the server; live listings appear here when published.
              </p>
            </div>
          ) : (
            <>
              {filteredFeatured.length > 0 && (
                <section className="mb-8">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-black text-[#FFF1F7]">
                      {themeAssets && (
                        <ThemeAssetImage
                          src={themeAssets.rail}
                          alt=""
                          className="h-5 w-10 shrink-0"
                        />
                      )}
                      Featured
                    </h2>
                  </div>
                  <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-smooth snap-x snap-mandatory touch-pan-x md:mx-0 md:px-0">
                    {filteredFeatured.map((g, i) => (
                      <GameCard
                        key={g.id}
                        game={g}
                        index={i}
                        blur={effectiveBlur}
                        ageVerified={ageVerified}
                        themeAssets={themeAssets}
                      />
                    ))}
                  </div>
                </section>
              )}

              {filteredHot.length > 0 && (
                <section className="mb-8">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-black text-[#FFF1F7]">
                      {themeAssets && (
                        <ThemeAssetImage
                          src={themeAssets.rail}
                          alt=""
                          className="h-5 w-10 shrink-0"
                        />
                      )}
                      {hotTitle}
                    </h2>
                    <Link
                      href="/new"
                      className="min-h-[44px] shrink-0 rounded-full px-2 py-2 text-[10px] font-bold text-[#FF4D8D] hover:underline md:min-h-0 md:py-0"
                    >
                      See all
                    </Link>
                  </div>
                  <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-smooth snap-x snap-mandatory touch-pan-x md:mx-0 md:px-0">
                    {filteredHot.map((g, i) => (
                      <GameCard
                        key={g.id}
                        game={g}
                        index={i}
                        blur={effectiveBlur}
                        ageVerified={ageVerified}
                        themeAssets={themeAssets}
                      />
                    ))}
                  </div>
                </section>
              )}

              {filteredNew.length > 0 && (
                <section className="mb-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-black text-[#FFF1F7]">
                      {themeAssets && (
                        <ThemeAssetImage
                          src={themeAssets.rail}
                          alt=""
                          className="h-5 w-10 shrink-0"
                        />
                      )}
                      {newTitle}
                    </h2>
                    <Link
                      href="/new"
                      className="min-h-[44px] shrink-0 rounded-full px-2 py-2 text-[10px] font-bold text-[#FF4D8D] hover:underline md:min-h-0 md:py-0"
                    >
                      See all
                    </Link>
                  </div>
                  <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-smooth snap-x snap-mandatory touch-pan-x md:mx-0 md:px-0">
                    {filteredNew.map((g, i) => (
                      <GameCard
                        key={g.id}
                        game={g}
                        index={i + 2}
                        rank={i + 1}
                        blur={effectiveBlur}
                        ageVerified={ageVerified}
                        themeAssets={themeAssets}
                      />
                    ))}
                  </div>
                </section>
              )}

              {recentVideos.length > 0 && (
                <section className="mb-8">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-black text-[#FFF1F7]">
                      {themeAssets && (
                        <ThemeAssetImage
                          src={themeAssets.rail}
                          alt=""
                          className="h-5 w-10 shrink-0"
                        />
                      )}
                      Recent videos
                    </h2>
                    <Link
                      href="/videos"
                      className="min-h-[44px] shrink-0 rounded-full px-2 py-2 text-[10px] font-bold text-[#FF4D8D] hover:underline md:min-h-0 md:py-0"
                    >
                      Top videos
                    </Link>
                  </div>
                  <p className="mb-3 text-[10px] font-semibold text-[#E9D5FF]/70">
                    Outbound links to publisher pages — not hosted on NSFW Droid.
                  </p>
                  <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-smooth snap-x snap-mandatory touch-pan-x md:mx-0 md:px-0">
                    {recentVideos.map((video, i) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        index={i}
                        blur={effectiveBlur}
                        layout="rail"
                      />
                    ))}
                  </div>
                </section>
              )}

              {filteredHot.length === 0 && filteredNew.length === 0 && (
                <p className="py-8 text-center text-sm text-[#E9D5FF]/80">
                  No titles match this filter. Try another platform chip.
                </p>
              )}

              <p className="mt-6 text-center text-[10px] font-semibold text-[#E9D5FF]/70">
                {rankingsFromAnalytics
                  ? "Rankings from on-site clicks and views."
                  : "Rankings update as visitors browse and click through to stores."}
              </p>
            </>
          )}
        </main>

        <SiteFooter ageVerified={ageVerified} />
      </div>
    </>
  );
}
