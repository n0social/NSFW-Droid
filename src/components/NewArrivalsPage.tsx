"use client";

import Link from "next/link";
import { effectiveCoverBlur } from "@/lib/cover-blur";
import type { Listing } from "@/db/schema";
import { GameCard } from "./GameCard";
import { AgeGate } from "./AgeGate";
import { VesperWelcomeCard } from "./VesperWelcomeCard";
import { HeroCarousel } from "./HeroCarousel";
import { SiteHeader } from "./site/SiteHeader";
import { SiteFooter } from "./site/SiteFooter";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import type { ResolvedLayoutDecorItem } from "@/lib/themes/types";
import { ThemeLayoutDecor } from "@/components/theme/ThemeLayoutDecor";

type Props = {
  ageVerified: boolean;
  blurCovers: boolean;
  hero: Listing[];
  more: Listing[];
  listingCount: number;
  catalogUnavailable?: boolean;
  themeAssets?: ThemeDecorFiles | null;
  layoutDecor?: ResolvedLayoutDecorItem[];
  newWindowDays?: number;
};

export function NewArrivalsPage({
  ageVerified,
  blurCovers,
  hero,
  more,
  listingCount,
  catalogUnavailable = false,
  themeAssets = null,
  layoutDecor = [],
  newWindowDays = 30,
}: Props) {
  const effectiveBlur = effectiveCoverBlur(ageVerified, blurCovers);
  const featured = hero[0] ?? null;

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

          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF4D8D]">Fresh catalog</p>
            <h1 className="mt-1 text-2xl font-black text-[#FFF1F7] sm:text-3xl">New arrivals</h1>
            <p className="mt-1 max-w-2xl text-xs text-[#E9D5FF]/85">
              Titles published in the last {newWindowDays} days, newest first — no backfill with
              older catalog entries.
            </p>
          </div>

          {featured && (
            <HeroCarousel
              featured={featured}
              blur={effectiveBlur}
              layoutDecor={layoutDecor}
              badgeLabel="Newest"
              subtitle="Latest title added to NSFW Droid — open the store page after you confirm 18+."
            />
          )}

          {hero.length > 0 && (
            <section className="mb-8 mt-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-black text-[#FFF1F7]">Top 10 newest</h2>
                <Link
                  href="/browse?sort=new"
                  className="min-h-[44px] shrink-0 rounded-full px-2 py-2 text-[10px] font-bold text-[#FF4D8D] hover:underline md:min-h-0 md:py-0"
                >
                  Full new list
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {hero.map((g, i) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    index={i}
                    rank={i + 1}
                    layout="grid"
                    blur={effectiveBlur}
                    themeAssets={themeAssets}
                  />
                ))}
              </div>
            </section>
          )}


          {more.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black text-[#FFF1F7]">More new arrivals</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {more.map((g, i) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    index={i + hero.length}
                    layout="grid"
                    blur={effectiveBlur}
                    themeAssets={themeAssets}
                  />
                ))}
              </div>
              <p className="mt-6 text-center">
                <Link
                  href="/browse?sort=new"
                  className="text-xs font-bold text-[#FF4D8D] hover:underline"
                >
                  Browse all titles by publish date →
                </Link>
              </p>
            </section>
          )}

          {!catalogUnavailable && hero.length === 0 && (
            <p className="py-12 text-center text-sm text-[#E9D5FF]/80">No published titles yet.</p>
          )}
        </main>
        <SiteFooter ageVerified={ageVerified} />
      </div>
    </>
  );
}
