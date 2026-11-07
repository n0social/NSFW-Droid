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
    if (chip === "All") return SHOP_HOME_PRODUCTS;
    return SHOP_HOME_PRODUCTS.filter((p) => (chip === "Tees" ? p.garment === "Tee" : p.garment === "Hoodie"));
  }, [chip]);

  const shown = isDesign ? products.slice(0, 3) : products;

  return (
    <>
      <ShopChipRow value={chip} onChange={setChip} />
      <p className="mb-3 text-xs text-[var(--theme-text-muted)]">{shown.length} listings</p>
      <section className="flex flex-col gap-3">
        {shown.map((p) => (
          <ShopProductCard
            key={p.title}
            title={p.title}
            price={p.price}
            garment={p.garment}
            imageSrc={isDesign ? undefined : p.imageSrc}
            imageAlt={p.imageAlt}
          />
        ))}
      </section>
    </>
  );
}
