"use client";

import { SHOP_CHIPS, type ShopChip } from "@/lib/shop/home-products";

type Props = {
  value: ShopChip;
  onChange: (chip: ShopChip) => void;
};

export function ShopChipRow({ value, onChange }: Props) {
  return (
    <nav className="flex w-full flex-row gap-2 md:w-40 md:flex-col" aria-label="Shop categories">
      {SHOP_CHIPS.map((label) => {
        const active = value === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className={`min-h-[44px] rounded-md px-3 text-left text-sm font-semibold ${
              active
                ? "bg-[var(--theme-primary)] text-[var(--background)]"
                : "text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
