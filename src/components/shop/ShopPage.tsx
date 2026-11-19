"use client";

import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ShopHomeMain } from "@/components/shop/ShopHomeMain";

type Props = {
  ageVerified: boolean;
  listingCount: number;
};

export function ShopPage({ ageVerified, listingCount }: Props) {
  return (
    <>
      <div className="relative z-[1]">
        <SiteHeader listingCount={listingCount} ageVerified={ageVerified} />

        <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="mb-6 max-w-3xl">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Shop</h1>
            <p className="mt-1 text-sm text-[var(--theme-text-muted)]">Tees or hoodies.</p>
          </div>
          <ShopHomeMain variant="production" />
        </main>

        <SiteFooter ageVerified={ageVerified} />
      </div>
    </>
  );
}
