"use client";

import { useMemo, useState } from "react";
import { ShopChipRow } from "@/components/shop/ShopChipRow";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { SHOP_HOME_PRODUCTS, type ShopChip, type ShopHomeVariant } from "@/lib/shop/home-products";

type Props = {
  variant: ShopHomeVariant;
};

export function ShopHomeMain({ variant }: Props) {
  const [chip, setChip] = useState<ShopChip>("All");
  const isDesign = variant === "design";

  const products = useMemo(() => {
    if (chip === "Tees") return [];
    return SHOP_HOME_PRODUCTS;
  }, [chip]);

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <ShopChipRow value={chip} onChange={setChip} />
      <section className="min-w-0 flex-1">
        {products.length === 0 ? (
          <p className="text-sm text-[var(--theme-text-muted)]">No tees yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(isDesign ? products.slice(0, 2) : products).map((p) => (
              <ShopProductCard key={p.title} title={p.title} imageSrc={isDesign ? undefined : p.imageSrc} imageAlt={p.imageAlt} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
