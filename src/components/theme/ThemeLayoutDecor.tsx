"use client";

import type { ResolvedLayoutDecorItem, ThemeLayoutDecorSlot } from "@/lib/themes/types";
import { ThemeAssetImage } from "@/components/theme/ThemeAssetImage";

type Props = {
  items: ResolvedLayoutDecorItem[];
  /** When set, only render these slots (e.g. page shell vs hero). */
  slots?: ThemeLayoutDecorSlot[];
  /** Extra classes on the wrapper (e.g. absolute inset-0 for hero bounds). */
  className?: string;
};

const SLOT_CLASS: Record<Exclude<ThemeLayoutDecorSlot, "page-pattern">, string> = {
  "corner-tl":
    "pointer-events-none fixed left-0 top-[4.5rem] z-[1] hidden h-20 w-16 object-contain object-left opacity-50 sm:block md:h-28 md:w-24 md:opacity-55",
  "corner-tr":
    "pointer-events-none fixed right-0 top-[4.5rem] z-[1] hidden h-20 w-16 object-contain object-right opacity-50 sm:block md:h-28 md:w-24 md:opacity-55",
  "corner-bl":
    "pointer-events-none fixed bottom-6 left-2 z-[1] hidden h-12 w-12 object-contain opacity-40 md:block md:h-16 md:w-16",
  "corner-br":
    "pointer-events-none fixed bottom-6 right-2 z-[1] hidden h-12 w-12 object-contain opacity-40 md:block md:h-16 md:w-16",
  "hero-accent-left":
    "pointer-events-none absolute bottom-3 left-3 z-[3] h-8 w-8 object-contain object-left-bottom opacity-80 max-[479px]:hidden sm:bottom-4 sm:left-4 sm:h-14 sm:w-14 sm:opacity-100",
  "hero-accent-right":
    "pointer-events-none absolute bottom-3 right-3 z-[3] h-8 w-8 object-contain object-right-bottom opacity-80 max-[479px]:hidden sm:bottom-4 sm:right-4 sm:h-12 sm:w-12 sm:opacity-100",
};

const DEFAULT_OPACITY: Partial<Record<ThemeLayoutDecorSlot, number>> = {
  "hero-accent-left": 0.75,
  "hero-accent-right": 0.85,
};

const PAGE_SHELL_SLOTS: ThemeLayoutDecorSlot[] = [
  "page-pattern",
  "corner-tl",
  "corner-tr",
  "corner-bl",
  "corner-br",
];

export function ThemeLayoutDecor({ items, slots, className }: Props) {
  if (!items.length) return null;

  const allowed = slots ?? PAGE_SHELL_SLOTS;
  const visible = items.filter((i) => allowed.includes(i.slot));
  if (!visible.length) return null;

  return (
    <div className={className ? `pointer-events-none ${className}` : "pointer-events-none"} aria-hidden>
      {visible.map((item, idx) => {
        const opacity = item.opacity ?? DEFAULT_OPACITY[item.slot];

        if (item.slot === "page-pattern") {
          const patternOpacity = opacity ?? 0.05;
          return (
            <div
              key={`${item.slot}-${item.url}-${idx}`}
              className="fixed inset-0 z-0 [mask-image:linear-gradient(to_bottom,black_0%,black_72%,transparent_100%)]"
              style={{
                opacity: patternOpacity,
                backgroundImage: `url(${item.url})`,
                backgroundRepeat: "repeat",
                backgroundSize: "96px 96px",
              }}
            />
          );
        }

        const style = opacity !== undefined ? { opacity } : undefined;
        const className = SLOT_CLASS[item.slot as Exclude<ThemeLayoutDecorSlot, "page-pattern">];
        return (
          <ThemeAssetImage
            key={`${item.slot}-${item.url}-${idx}`}
            src={item.url}
            alt=""
            className={className}
            style={style}
          />
        );
      })}
    </div>
  );
}

export const HERO_LAYOUT_DECOR_SLOTS: ThemeLayoutDecorSlot[] = [
  "hero-accent-left",
  "hero-accent-right",
];
