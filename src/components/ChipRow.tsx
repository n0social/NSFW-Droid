"use client";

import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import { ThemeAssetImage } from "@/components/theme/ThemeAssetImage";

const CHIPS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "windows", label: "Windows" },
  { id: "browser", label: "Browser" },
  { id: "linux", label: "Linux" },
  { id: "mac", label: "Mac" },
  { id: "android", label: "Android" },
] as const;

export type ChipId = (typeof CHIPS)[number]["id"];

type Props = {
  active: ChipId;
  onChange: (id: ChipId) => void;
  themeAssets?: ThemeDecorFiles | null;
};

export function ChipRow({ active, onChange, themeAssets }: Props) {
  return (
    <div
      className="chip-scroll -mx-4 mb-6 flex items-center gap-2 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-smooth snap-x snap-mandatory touch-pan-x md:mx-0 md:px-0"
      role="toolbar"
      aria-label="Filter by platform"
    >
      {CHIPS.map((chip) => {
        const isActive = active === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChange(chip.id)}
            className={`inline-flex min-h-[44px] shrink-0 snap-start items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-extrabold transition-colors md:min-h-0 md:py-1.5 md:text-[11px] ${
              isActive
                ? "bg-[var(--theme-primary)] text-[var(--foreground)]"
                : "border border-[var(--theme-primary)]/40 text-[var(--theme-text-muted)] hover:border-[var(--theme-accent)]"
            }`}
          >
            {themeAssets && isActive && (
              <ThemeAssetImage src={themeAssets.chip} alt="" className="h-4 w-4 shrink-0" />
            )}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
