"use client";

import Link from "next/link";
import {
  CURATED_SFM_TUTORIALS,
  SFM_TUTORIAL_TOPICS,
  sfmTutorialsByTopic,
  type CuratedSfmTutorial,
  type SfmTutorialMediaType,
} from "@/lib/creator-assets-sfm-tutorials-curated";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import type { ResolvedLayoutDecorItem } from "@/lib/themes/types";
import { ThemeLayoutDecor } from "@/components/theme/ThemeLayoutDecor";

type Props = {
  ageVerified: boolean;
  listingCount: number;
  themeAssets?: ThemeDecorFiles | null;
  layoutDecor?: ResolvedLayoutDecorItem[];
};

const TYPE_BADGE: Record<SfmTutorialMediaType, string> = {
  video: "Video",
  written: "Guide",
  "forum thread": "Forum",
};

function TutorialCard({ item }: { item: CuratedSfmTutorial }) {
  return (
    <article
      className="flex h-full flex-col rounded-2xl border border-[var(--theme-primary)]/25 bg-[var(--theme-surface)]/70 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
    >
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-1 flex-col p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-black text-[#FFF1F7] group-hover:text-[#FF4D8D]">{item.name}</h3>
          <span className="shrink-0 rounded-full border border-[#FF4D8D]/40 px-2 py-0.5 text-[9px] font-bold uppercase text-[#F9A8D4]">
            {TYPE_BADGE[item.type]}
          </span>
        </div>
        <p className="mt-2 flex-1 text-[11px] leading-relaxed text-[#E9D5FF]/80">{item.blurb}</p>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[#FF4D8D]">
          External tutorial →
        </p>
      </a>
    </article>
  );
}

export function CreatorSfmTutorialsPage({
  ageVerified,
  listingCount,
  themeAssets = null,
  layoutDecor = [],
}: Props) {
  return (
    <div className="relative z-[1]">
      {layoutDecor.length > 0 && <ThemeLayoutDecor items={layoutDecor} />}
      <SiteHeader listingCount={listingCount} ageVerified={ageVerified} themeAssets={themeAssets} />
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 md:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF4D8D]">Creator assets</p>
          <h1 className="mt-1 text-2xl font-black text-[#FFF1F7] sm:text-3xl">NSFW SFM tutorials</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#E9D5FF]/85">
            Curated outbound guides for adult Source Filmmaker. More hubs on{" "}
            <Link href="/links" className="font-bold text-[#FF4D8D] underline">Community links</Link>.
          </p>
          <p className="mt-2 text-[10px] font-semibold text-[#E9D5FF]/55">
            {CURATED_SFM_TUTORIALS.length} links ·{" "}
            <code className="text-[9px]">src/lib/creator-assets-sfm-tutorials-curated.ts</code>
          </p>
        </div>
        <div className="space-y-10">
          {SFM_TUTORIAL_TOPICS.map((group) => {
            const items = sfmTutorialsByTopic(group.key);
            if (items.length === 0) return null;
            return (
              <section key={group.key}>
                <h2 className="text-xs font-black uppercase tracking-wide text-[#F9A8D4]">{group.label}</h2>
                <p className="mt-1 text-[11px] text-[#E9D5FF]/65">{group.hint}</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <li key={item.id}>
                      <TutorialCard item={item} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
      <SiteFooter ageVerified={ageVerified} />
    </div>
  );
}
