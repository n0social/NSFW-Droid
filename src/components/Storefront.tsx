"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Listing } from "@/db/schema";
import { GameCard } from "./GameCard";
import { AgeGate } from "./AgeGate";
import { HeroCarousel } from "./HeroCarousel";
import { ChipRow, type ChipId } from "./ChipRow";
import { SiteHeader } from "./site/SiteHeader";
import { SiteFooter } from "./site/SiteFooter";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import type { ResolvedLayoutDecorItem } from "@/lib/themes/types";
import { ThemeAssetImage } from "@/components/theme/ThemeAssetImage";
import { ThemeLayoutDecor } from "@/components/theme/ThemeLayoutDecor";

type Props = {
  ageVerified: boolean;
  blurCovers: boolean;
  themeAssets?: ThemeDecorFiles | null;
  layoutDecor?: ResolvedLayoutDecorItem[];
  topGrossing: Listing[];
  newReleases: Listing[];
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
  blurCovers: initialBlur,
  topGrossing,
  newReleases,
  all,
  listingCount,
  rankingsFromAnalytics = false,
  catalogUnavailable = false,
  themeAssets = null,
  layoutDecor = [],
}: Props) {
  const [blurCovers, setBlurCovers] = useState(initialBlur);
  const [chip, setChip] = useState<ChipId>("all");

  const forceBlur = !ageVerified;
  const effectiveBlur = forceBlur || blurCovers;

  const filteredHot = useMemo(
    () => topGrossing.filter((g) => matchesChip(g, chip)),
    [topGrossing, chip],
  );
  const filteredNew = useMemo(
    () => newReleases.filter((g) => matchesChip(g, chip)),
    [newReleases, chip],
  );

  const featured = topGrossing[0] ?? all[0] ?? null;

  const hotTitle = rankingsFromAnalytics ? "Hottest this week" : "Top picks";
  const newTitle = rankingsFromAnalytics ? "Trending now" : "New releases";

  async function toggleBlur() {
    if (!ageVerified) return;
    const next = !blurCovers;
    setBlurCovers(next);
    await fetch("/api/blur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
  }

  const blurToggle = (
    <button
      type="button"
      onClick={toggleBlur}
      disabled={!ageVerified}
      title={
        !ageVerified
          ? "Confirm age to change blur"
          : "Toggle cover blur for testing"
      }
      className={`min-h-[44px] rounded-full px-3 py-2 text-[11px] font-extrabold md:min-h-0 md:py-1.5 md:text-[10px] ${
        effectiveBlur
          ? "bg-[var(--theme-accent)] text-[var(--foreground)]"
          : "border-2 border-[var(--theme-primary)] text-[var(--theme-text-muted)]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      Blur: {effectiveBlur ? "ON" : "OFF"}
    </button>
  );

  return (
    <>
      <AgeGate open={!ageVerified} />

      <div className={`relative z-[1] ${!ageVerified ? "pointer-events-none select-none" : ""}`}>
        {layoutDecor.length > 0 && <ThemeLayoutDecor items={layoutDecor} />}
        <SiteHeader
          listingCount={listingCount}
          blurToggle={blurToggle}
          ageVerified={ageVerified}
          themeAssets={themeAssets}
        />

        <main id="browse" className="mx-auto max-w-7xl px-4 pb-4 pt-4 md:px-6 lg:px-8">
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
            featured={featured}
            blur={effectiveBlur}
            themeAssets={themeAssets}
            layoutDecor={layoutDecor}
          />
          <ChipRow active={chip} onChange={setChip} themeAssets={themeAssets} />

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
                Run ingest on the server, then approve titles in{" "}
                <Link href="/admin" className="text-[#FF4D8D] underline">
                  admin
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
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
                    <span className="text-[10px] font-bold text-[#FF4D8D]">See all</span>
                  </div>
                  <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-smooth snap-x snap-mandatory touch-pan-x md:mx-0 md:px-0">
                    {filteredHot.map((g, i) => (
                      <GameCard
                        key={g.id}
                        game={g}
                        index={i}
                        rank={g.chartRank ?? i + 1}
                        blur={effectiveBlur}
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
                    <span className="text-[10px] font-bold text-[#FF4D8D]">See all</span>
                  </div>
                  <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-smooth snap-x snap-mandatory touch-pan-x md:mx-0 md:px-0">
                    {filteredNew.map((g, i) => (
                      <GameCard
                        key={g.id}
                        game={g}
                        index={i + 2}
                        blur={effectiveBlur}
                        themeAssets={themeAssets}
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

        <SiteFooter />
      </div>
    </>
  );
}
