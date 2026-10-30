import Image from "next/image";
import { SHOP_ASSETS } from "@/lib/shop/assets";
import type { ShopHomeVariant } from "@/lib/shop/home-products";

type Props = {
  variant: ShopHomeVariant;
};

export function ShopHero({ variant }: Props) {
  const isDesign = variant === "design";

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border-2 border-[var(--theme-border)] bg-[var(--theme-surface)]">
      <div className="relative aspect-[16/9] max-h-[360px] w-full bg-[var(--background)]">
        {!isDesign && (
          <Image
            src={SHOP_ASSETS.logoBanner16x9}
            alt="NSFW Droid wordmark banner"
            fill
            className="object-cover object-center"
            priority
            sizes="(max-width: 768px) 100vw, 1152px"
          />
        )}
        {!isDesign && (
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/85 via-[var(--background)]/45 to-transparent" />
        )}
        <div className="absolute inset-0 flex items-end gap-4 p-4 md:p-6">
          {isDesign ? (
            <div
              className="hidden h-32 w-24 shrink-0 rounded-lg border border-dashed border-[var(--theme-primary)]/40 bg-[var(--theme-surface)] sm:block"
              aria-hidden
            />
          ) : (
            <div className="relative hidden h-36 w-28 shrink-0 sm:block">
              <Image
                src={SHOP_ASSETS.pandaHoodieV2}
                alt=""
                fill
                className="object-contain object-bottom drop-shadow-lg"
                sizes="112px"
              />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-lg font-black md:text-xl">Official NSFW Droid goods</p>
            <p className="text-sm text-[var(--theme-text-muted)]">
              Support the catalog — wear the droid. Stickers, wallpapers, wear.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--theme-primary)] px-4 py-2 text-xs font-extrabold text-[var(--background)]">
                Browse merch
              </span>
              <span className="rounded-full border border-[var(--theme-primary)]/40 px-4 py-2 text-xs font-extrabold text-[var(--theme-text-muted)]">
                Digital packs
              </span>
            </div>
          </div>
          {isDesign ? (
            <span className="absolute right-3 top-3 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 py-1 text-[9px] font-bold uppercase text-[var(--theme-text-muted)]">
              16:9 banner ref
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
