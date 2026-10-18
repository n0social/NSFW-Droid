"use client";

import Link from "next/link";
import {
  CREATOR_ASSETS_BLENDER_GROUPS,
  CURATED_CREATOR_ASSETS_BLENDER,
  creatorAssetsBlenderByCategory,
  type CuratedCreatorAssetsBlenderLink,
} from "@/lib/creator-assets-blender-curated";
import {
  CREATOR_SOUND_GROUPS,
  CURATED_CREATOR_SOUNDS,
  creatorSoundsByCategory,
} from "@/lib/creator-assets-sounds-curated";
import { CREATOR_ASSETS_SECTIONS } from "@/lib/creator-assets-hub";
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

const CARD_GRADIENTS = [
  "linear-gradient(145deg, #4a1d6a 0%, #C026D3 45%, #14061C 100%)",
  "linear-gradient(145deg, #2d1b4e 0%, #FF4D8D 50%, #241033 100%)",
  "linear-gradient(160deg, #1a3a4a 0%, #7c3aed 40%, #14061C 100%)",
];

type CuratedOutboundLink = {
  name: string;
  blurb: string;
  href: string;
  licenseNote?: string;
};

function CuratedOutboundCard({ item, index }: { item: CuratedOutboundLink; index: number }) {
  const initial = item.name.trim().charAt(0).toUpperCase();
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <article
      className="flex h-full flex-col rounded-2xl border border-[var(--theme-primary)]/25 bg-[var(--theme-surface)]/70 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
    >
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-1 flex-col p-4 sm:p-5"
        aria-label={`Visit ${item.name} (opens in new tab)`}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-[#FFF1F7] shadow-inner"
            style={{ background: gradient }}
            aria-hidden
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-[#FFF1F7] group-hover:text-[#FF4D8D]">
              {item.name}
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[#E9D5FF]/80">{item.blurb}</p>
            {item.licenseNote && (
              <p className="mt-2 text-[10px] font-semibold text-[#E9D5FF]/55">
                License: {item.licenseNote}
              </p>
            )}
          </div>
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[#FF4D8D]">
          External download →
        </p>
      </a>
    </article>
  );
}

export function CreatorAssetsHubPage({
  ageVerified,
  listingCount,
  themeAssets = null,
  layoutDecor = [],
}: Props) {
  const soundCount = CURATED_CREATOR_SOUNDS.length;
  const blenderCount = CURATED_CREATOR_ASSETS_BLENDER.length;

  return (
    <>
      <div className="relative z-[1]">
        {layoutDecor.length > 0 && <ThemeLayoutDecor items={layoutDecor} />}
        <SiteHeader listingCount={listingCount} ageVerified={ageVerified} themeAssets={themeAssets} />

        <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 md:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF4D8D]">
              Creator resources
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#FFF1F7] sm:text-3xl">Creator assets</h1>
            <p className="mt-2 text-xs leading-relaxed text-[#E9D5FF]/85">
              Outbound picks for people building{" "}
              <strong className="font-bold text-[#FFF1F7]">NSFW games</strong> and{" "}
              <strong className="font-bold text-[#FFF1F7]">SFM / 3D</strong> scenes — starting with
              sound libraries and Blender environment picks. For playable titles we list, use{" "}
              <Link href="/browse" className="font-bold text-[#FF4D8D] underline">
                Browse
              </Link>
              ; for studios see{" "}
              <Link href="/creators" className="font-bold text-[#FF4D8D] underline">
                Creators
              </Link>
              .
            </p>
          </div>

          <nav className="mb-10 flex flex-wrap gap-2" aria-label="Creator asset sections">
            {CREATOR_ASSETS_SECTIONS.map((section) =>
              section.available ? (
                <a
                  key={section.label}
                  href={section.href}
                  className="rounded-full border border-[#FF4D8D]/50 bg-[#FF4D8D]/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#FFF1F7]"
                >
                  {section.label}
                </a>
              ) : (
                <span
                  key={section.label}
                  className="rounded-full border border-[var(--theme-primary)]/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#E9D5FF]/45"
                  title={section.hint}
                >
                  {section.label} (soon)
                </span>
              ),
            )}
          </nav>

          <section id="sounds" className="scroll-mt-6 space-y-10" aria-labelledby="sounds-heading">
            <div>
              <h2 id="sounds-heading" className="text-xs font-black uppercase tracking-wide text-[#F9A8D4]">
                Sounds & VO
              </h2>
              <p className="mt-1 text-[11px] text-[#E9D5FF]/65">
                {soundCount} curated links · edit in{" "}
                <code className="text-[9px]">src/lib/creator-assets-sounds-curated.ts</code>
              </p>
            </div>

            {CREATOR_SOUND_GROUPS.map((group) => {
              const items = creatorSoundsByCategory(group.key);
              if (items.length === 0) return null;
              return (
                <div key={group.key}>
                  <h3 className="text-xs font-black uppercase tracking-wide text-[#F9A8D4]">
                    {group.label}
                  </h3>
                  <p className="mt-1 text-[11px] text-[#E9D5FF]/65">{group.hint}</p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item, index) => (
                      <li key={item.id}>
                        <CuratedOutboundCard item={item} index={index} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>

          <section id="tutorials" className="mt-14 scroll-mt-6 border-t border-[var(--theme-primary)]/15 pt-8">
            <h2 className="text-xs font-black uppercase tracking-wide text-[#E9D5FF]/40">Tutorials</h2>
            <p className="mt-2 text-[11px] text-[#E9D5FF]/50">
              SFM and Blender pipeline guides will land here when the tutorials curation ships.
            </p>
          </section>

          <section id="blender" className="mt-14 scroll-mt-6 space-y-10 border-t border-[var(--theme-primary)]/15 pt-8" aria-labelledby="blender-heading">
            <div>
              <h2 id="blender-heading" className="text-xs font-black uppercase tracking-wide text-[#F9A8D4]">
                Blender & files
              </h2>
              <p className="mt-1 text-[11px] text-[#E9D5FF]/65">
                {blenderCount} curated links · edit in{" "}
                <code className="text-[9px]">src/lib/creator-assets-blender-curated.ts</code>
              </p>
            </div>

            {CREATOR_ASSETS_BLENDER_GROUPS.map((group) => {
              const items = creatorAssetsBlenderByCategory(group.key);
              if (items.length === 0) return null;
              return (
                <div key={group.key}>
                  <h3 className="text-xs font-black uppercase tracking-wide text-[#F9A8D4]">
                    {group.label}
                  </h3>
                  <p className="mt-1 text-[11px] text-[#E9D5FF]/65">{group.hint}</p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item: CuratedCreatorAssetsBlenderLink, index: number) => (
                      <li key={item.id}>
                        <CuratedOutboundCard item={item} index={index} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        </main>

        <SiteFooter ageVerified={ageVerified} />
      </div>
    </>
  );
}
