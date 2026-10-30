"use client";

import { SHOP_CHIPS, type ShopChip } from "@/lib/shop/home-products";

type Props = {
  value: ShopChip;
  onChange: (chip: ShopChip) => void;
};

export function ShopChipRow({ value, onChange }: Props) {
  return (
    <div
      className="chip-scroll mb-8 flex gap-2 overflow-x-auto pb-2"
      role="toolbar"
      aria-label="Shop collections"
    >
      {SHOP_CHIPS.map((label) => {
        const active = value === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full px-4 py-2 text-xs font-extrabold ${
              active
                ? "bg-[var(--theme-primary)] text-[var(--foreground)]"
                : "border border-[var(--theme-primary)]/40 text-[var(--theme-text-muted)]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
