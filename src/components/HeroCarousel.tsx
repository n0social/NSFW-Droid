"use client";

import { useState } from "react";
import type { Listing } from "@/db/schema";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import type { ResolvedLayoutDecorItem } from "@/lib/themes/types";
import { ThemeAssetImage } from "@/components/theme/ThemeAssetImage";
import { HERO_LAYOUT_DECOR_SLOTS, ThemeLayoutDecor } from "@/components/theme/ThemeLayoutDecor";
import { displayListingTitle } from "@/lib/listing-display";

type Props = {
  featured: Listing | null;
  blur: boolean;
  themeAssets?: ThemeDecorFiles | null;
  layoutDecor?: ResolvedLayoutDecorItem[];
};

export function HeroCarousel({ featured, blur, themeAssets, layoutDecor = [] }: Props) {
  const title = featured ? displayListingTitle(featured.title) : "Mature games catalog";
  const subtitle = featured
    ? "Featured pick from the catalog — open the store page after you confirm 18+."
    : "Discover adult titles on itch.io, Steam, and partner stores. Rankings from real traffic on this site.";

  const href = featured ? `/api/go/${featured.id}` : "#browse";
  const coverUrl = featured?.coverImageUrl?.trim() || null;
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(coverUrl) && !coverFailed;

  const fallbackGradient =
    "linear-gradient(135deg, #2d1b4e 0%, #C026D3 40%, #FF4D8D 70%, #14061C 100%)";

  return (
    <section className="relative mb-6 rounded-2xl border border-[var(--theme-primary)]/25 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
      <div
        className="relative w-full overflow-hidden rounded-2xl aspect-[4/3] min-h-[12.75rem] sm:aspect-[2/1] sm:min-h-[11rem] md:aspect-[21/9] md:min-h-0"
        style={{ background: showCover ? "#14061C" : fallbackGradient }}
      >
        {showCover && (
          <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl!}
              alt=""
              className={`h-full w-full object-cover object-center ${blur ? "scale-105 blur-md" : ""}`}
              onError={() => setCoverFailed(true)}
            />
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-[var(--theme-primary)]/10 via-transparent to-[var(--theme-accent)]/15"
          aria-hidden
        />

        {themeAssets && (
          <ThemeAssetImage
            src={themeAssets.decor}
            alt=""
            className="pointer-events-none absolute right-1 top-1 z-[2] h-10 w-auto max-h-[28%] max-w-[30%] object-contain object-right opacity-75 sm:right-2 sm:top-2 sm:h-16 sm:max-h-[32%] sm:max-w-[38%] sm:opacity-90 md:h-24 md:max-w-[42%]"
          />
        )}

        {layoutDecor.length > 0 && (
          <ThemeLayoutDecor
            items={layoutDecor}
            slots={HERO_LAYOUT_DECOR_SLOTS}
            className="absolute inset-0 z-[3] overflow-hidden"
          />
        )}

        <div
          className={`absolute inset-0 z-[4] flex flex-col justify-end p-3 sm:p-6 md:p-10 ${blur && featured && !showCover ? "blur-md" : ""}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#14061Cee] via-[#14061C55] to-transparent" />
          <div className="relative z-10 min-w-0 max-w-[70%] sm:max-w-md md:max-w-xl">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--theme-accent)] sm:text-[10px] sm:tracking-widest">
              {featured ? "Featured" : "Welcome"}
            </p>
            <h1 className="mt-0.5 line-clamp-2 text-base font-black leading-snug text-[#FFF1F7] sm:mt-1 sm:text-2xl sm:leading-tight md:text-3xl">
              {title}
            </h1>
            <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-snug text-[#E9D5FF]/90 sm:mt-2 sm:text-xs sm:leading-normal md:text-sm">
              {subtitle}
            </p>
            <a
              href={href}
              className="mt-2 inline-flex min-h-[44px] items-center rounded-full bg-[var(--theme-accent)] px-4 py-2 text-[11px] font-black text-[var(--foreground)] shadow-lg hover:opacity-90 sm:mt-4 sm:px-5 sm:py-2.5 sm:text-xs"
            >
              {featured ? "View on store" : "Browse catalog"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
