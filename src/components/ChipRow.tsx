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
    <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
      {CHIPS.map((chip) => {
        const isActive = active === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChange(chip.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-extrabold transition-colors ${
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
