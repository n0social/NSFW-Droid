"use client";

import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ShopHomeMain } from "@/components/shop/ShopHomeMain";
import { ThemeLayoutDecor } from "@/components/theme/ThemeLayoutDecor";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import type { ResolvedLayoutDecorItem } from "@/lib/themes/types";

type Props = {
  ageVerified: boolean;
  listingCount: number;
  themeAssets?: ThemeDecorFiles | null;
  layoutDecor?: ResolvedLayoutDecorItem[];
};

export function ShopPage({
  ageVerified,
  listingCount,
  themeAssets = null,
  layoutDecor = [],
}: Props) {
  return (
    <>
      <div className="relative z-[1]">
        {layoutDecor.length > 0 && <ThemeLayoutDecor items={layoutDecor} />}
        <SiteHeader listingCount={listingCount} ageVerified={ageVerified} themeAssets={themeAssets} />

        <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="mb-6 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-accent)]">Merch</p>
            <h1 className="mt-1 text-2xl font-black text-[var(--foreground)] sm:text-3xl">NSFW Droid shop</h1>
            <p className="mt-2 text-xs leading-relaxed text-[var(--theme-text-muted)]">
              Official stickers, wear, and digital packs — same green catalog chrome, sibling to game listings on{" "}
              <span className="font-semibold text-[var(--foreground)]">www.nsfwdroid.com</span>.
            </p>
          </div>
          <ShopHomeMain variant="production" />
        </main>

        <SiteFooter ageVerified={ageVerified} />
      </div>
    </>
  );
}
