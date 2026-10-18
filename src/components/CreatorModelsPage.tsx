"use client";

import Link from "next/link";
import { TOP_SFM_MODELS } from "@/lib/sfm-models-curated";
import { SfmModelCard } from "@/components/SfmModelCard";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import type { ResolvedLayoutDecorItem } from "@/lib/themes/types";
import { ThemeLayoutDecor } from "@/components/theme/ThemeLayoutDecor";

type Props = {
  ageVerified: boolean;
  blurCovers: boolean;
  listingCount: number;
  themeAssets?: ThemeDecorFiles | null;
  layoutDecor?: ResolvedLayoutDecorItem[];
};

export function CreatorModelsPage({
  ageVerified,
  blurCovers,
  listingCount,
  themeAssets = null,
  layoutDecor = [],
}: Props) {
  const blur = !ageVerified || blurCovers;

  return (
    <>
      <div className="relative z-[1]">
        {layoutDecor.length > 0 && <ThemeLayoutDecor items={layoutDecor} />}
        <SiteHeader listingCount={listingCount} ageVerified={ageVerified} themeAssets={themeAssets} />

        <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 md:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF4D8D]">
              Creator assets
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#FFF1F7] sm:text-3xl">Top SFM models</h1>
            <p className="mt-2 text-xs leading-relaxed text-[#E9D5FF]/85">
              The <strong className="font-bold text-[#FFF1F7]">most-used NSFW Source Filmmaker models</strong> we
              see in compilations and community uploads — each card links straight to the{" "}
              <strong className="font-bold text-[#FFF1F7]">SmutBase</strong> project page (Open3DLab network).
              We do not host model files or previews from third-party servers beyond optional local card art in{" "}
              <code className="text-[9px]">public/creator-models/</code>.
            </p>
            <p className="mt-2 text-[10px] font-semibold text-[#E9D5FF]/55">
              {TOP_SFM_MODELS.length} picks · updated manually ·{" "}
              <Link href="/links" className="text-[#FF4D8D] underline">
                More SFM hubs
              </Link>
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {TOP_SFM_MODELS.map((model) => (
              <li key={model.id}>
                <SfmModelCard model={model} blur={blur} />
              </li>
            ))}
          </ul>

          <p className="mt-12 rounded-2xl border border-dashed border-[var(--theme-primary)]/40 bg-[var(--theme-surface)]/40 p-4 text-[11px] leading-relaxed text-[#E9D5FF]/75">
            18+ only. Models are fan works; credit uploaders on SmutBase and follow their licenses. Wrong or
            outdated link?{" "}
            <Link href="/submit" className="font-bold text-[#FF4D8D] underline">
              Submit
            </Link>{" "}
            with the character name and we&apos;ll update the curated list. Sounds, tutorials, and more asset
            categories coming in the same hub.
          </p>
        </main>

        <SiteFooter ageVerified={ageVerified} />
      </div>
    </>
  );
}
