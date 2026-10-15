"use client";

import { useState } from "react";
import type { Listing } from "@/db/schema";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import { ThemeAssetImage } from "@/components/theme/ThemeAssetImage";

type Props = {
  featured: Listing | null;
  blur: boolean;
  themeAssets?: ThemeDecorFiles | null;
};

export function HeroCarousel({ featured, blur, themeAssets }: Props) {
  const title = featured?.title ?? "Mature games catalog";
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
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--theme-primary)]/25 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
      {themeAssets && (
        <ThemeAssetImage
          src={themeAssets.decor}
          alt=""
          className="pointer-events-none absolute right-0 top-0 z-[2] h-24 w-auto max-w-[45%] opacity-90 sm:h-32"
        />
      )}
      <div
        className="relative aspect-[21/9] min-h-[128px] w-full sm:min-h-[180px] md:min-h-[220px]"
        style={{ background: showCover ? "#14061C" : fallbackGradient }}
      >
        {showCover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl!}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${blur ? "blur-md scale-105" : ""}`}
            onError={() => setCoverFailed(true)}
          />
        )}
        <div
          className={`relative flex h-full min-h-[128px] flex-col justify-end p-4 sm:min-h-[180px] sm:p-8 md:min-h-[220px] md:p-10 ${blur && featured && !showCover ? "blur-md" : ""}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#14061Cee] via-[#14061C66] to-transparent" />
          <div className="relative z-10 max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-accent)]">
              {featured ? "Featured" : "Welcome"}
            </p>
            <h1 className="mt-1 text-xl font-black leading-tight text-[#FFF1F7] sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-xs font-medium text-[#E9D5FF]/90 sm:text-sm">{subtitle}</p>
            <a
              href={href}
              className="mt-4 inline-block rounded-full bg-[var(--theme-accent)] px-5 py-2.5 text-xs font-black text-[var(--foreground)] shadow-lg hover:opacity-90"
            >
              {featured ? "View on store" : "Browse catalog"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
