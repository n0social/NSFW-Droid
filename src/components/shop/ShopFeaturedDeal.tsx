import Image from "next/image";
import { SHOP_FEATURED_DEAL } from "@/lib/shop/home-products";

type Props = {
  usePlaceholderArt?: boolean;
};

export function ShopFeaturedDeal({ usePlaceholderArt = false }: Props) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-[var(--theme-text-muted)]">
        Featured deal
      </h2>
      <div className="grid gap-4 rounded-2xl border-2 border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 md:grid-cols-[auto_1fr] md:items-center">
        {usePlaceholderArt ? (
          <div className="mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-[#C026D3]/60 bg-[var(--background)] text-center">
            <span className="text-[10px] font-black uppercase text-[var(--foreground)]">DEAL</span>
            <span className="text-[9px] font-bold text-[var(--theme-text-muted)]">chibi</span>
          </div>
        ) : (
          <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-[#C026D3]/60 bg-[var(--background)]">
            <Image
              src={SHOP_FEATURED_DEAL.imageSrc}
              alt={SHOP_FEATURED_DEAL.imageAlt}
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>
        )}
        <div>
          <p className="font-bold">{SHOP_FEATURED_DEAL.title}</p>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{SHOP_FEATURED_DEAL.description}</p>
          <p className="mt-2 font-bold tabular-nums text-[var(--theme-primary)]">{SHOP_FEATURED_DEAL.price}</p>
        </div>
      </div>
    </section>
  );
}
