"use client";

import { useMemo, useState } from "react";
import { ShopChipRow } from "@/components/shop/ShopChipRow";
import { ShopFeaturedDeal } from "@/components/shop/ShopFeaturedDeal";
import { ShopHero } from "@/components/shop/ShopHero";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { SHOP_HOME_PRODUCTS, type ShopChip, type ShopHomeVariant } from "@/lib/shop/home-products";

type Props = {
  variant: ShopHomeVariant;
};

export function ShopHomeMain({ variant }: Props) {
  const [chip, setChip] = useState<ShopChip>("All");
  const isDesign = variant === "design";

  const products = useMemo(() => {
    if (chip === "All") return SHOP_HOME_PRODUCTS;
    return SHOP_HOME_PRODUCTS.filter((p) => p.chip === chip);
  }, [chip]);

  return (
    <>
      {isDesign ? (
        <p className="mb-6 rounded-xl border border-[var(--theme-primary)]/30 bg-[var(--theme-surface)] px-4 py-3 text-center text-xs font-semibold text-[var(--theme-text-muted)]">
          Design mockup — not wired to cart, checkout, or inventory.
        </p>
      ) : (
        <p className="mb-6 rounded-xl border border-[var(--theme-primary)]/25 bg-[var(--theme-surface)]/80 px-4 py-3 text-center text-xs font-semibold text-[var(--theme-text-muted)]">
          Storefront preview — browse approved merch art; cart and checkout not connected yet.
        </p>
      )}

      <ShopHero variant={variant} />

      <ShopChipRow value={chip} onChange={setChip} />

      <ShopFeaturedDeal usePlaceholderArt={isDesign} />

      <section>
        <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-[var(--theme-text-muted)]">
          {isDesign ? "Grid preview" : "Featured products"}
        </h2>
        <div
          className={`grid grid-cols-2 gap-4 ${isDesign ? "md:grid-cols-3" : "md:grid-cols-3 lg:grid-cols-4"}`}
        >
          {(isDesign ? products.slice(0, 3) : products).map((p) => (
            <ShopProductCard
              key={p.title}
              title={p.title}
              price={p.price}
              pill={p.pill}
              imageSrc={isDesign ? undefined : p.imageSrc}
              imageAlt={p.imageAlt}
              mockLabel={p.mockLabel ?? "SKU"}
            />
          ))}
        </div>
      </section>

      {isDesign ? (
        <p className="mt-10 text-center text-xs text-[var(--theme-text-muted)]">
          Collection, PDP, cart drawer, and checkout shells — see interactive canvas and{" "}
          <span className="font-semibold">docs/shop-layout-mockups.md</span>. Production home:{" "}
          <span className="font-semibold">/shop</span>.
        </p>
      ) : (
        <p className="mt-10 text-center text-xs text-[var(--theme-text-muted)]">
          Ships from US · 18+ brand · Digital sales final. Collection, PDP, and cart — next passes.
        </p>
      )}
    </>
  );
}
