"use client";

import Link from "next/link";
import {
  COMMUNITY_LINK_GROUPS,
  CURATED_COMMUNITY_LINKS,
  communityLinksByCategory,
  type CuratedCommunityLink,
} from "@/lib/community-links-curated";
import { OutboundPopunderLink } from "@/components/OutboundPopunderLink";
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

function LinkCard({
  item,
  index,
  ageVerified,
}: {
  item: CuratedCommunityLink;
  index: number;
  ageVerified: boolean;
}) {
  const initial = item.name.trim().charAt(0).toUpperCase();
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <article
      className="flex h-full flex-col rounded-2xl border border-[var(--theme-primary)]/25 bg-[var(--theme-surface)]/70 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
    >
      <OutboundPopunderLink
        href={item.href}
        ageVerified={ageVerified}
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
          </div>
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[#FF4D8D]">
          External site →
        </p>
      </OutboundPopunderLink>
    </article>
  );
}

export function CommunityLinksPage({
  ageVerified,
  listingCount,
  themeAssets = null,
  layoutDecor = [],
}: Props) {
  const linkCount = CURATED_COMMUNITY_LINKS.length;

  return (
    <>
      <div className="relative z-[1]">
        {layoutDecor.length > 0 && <ThemeLayoutDecor items={layoutDecor} />}
        <SiteHeader listingCount={listingCount} ageVerified={ageVerified} themeAssets={themeAssets} />

        <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 md:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF4D8D]">
              Curated outbound
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#FFF1F7] sm:text-3xl">Community links</h1>
            <p className="mt-2 text-xs leading-relaxed text-[#E9D5FF]/85">
              End-to-end links to other <strong className="font-bold text-[#FFF1F7]">NSFW game catalogs</strong>,
              communities, and major <strong className="font-bold text-[#FFF1F7]">animated / hentai / SFM</strong>{" "}
              destinations. NSFW Droid does not operate these sites — we list them so you can move between
              trusted hubs. For studios and spotlight games, see{" "}
              <Link href="/creators" className="font-bold text-[#FF4D8D] underline">
                Creators
              </Link>
              ; for titles we ingest, use{" "}
              <Link href="/browse" className="font-bold text-[#FF4D8D] underline">
                Browse
              </Link>
              .
            </p>
            <p className="mt-2 text-[10px] font-semibold text-[#E9D5FF]/55">
              {linkCount} links · edit in{" "}
              <code className="text-[9px]">src/lib/community-links-curated.ts</code>
            </p>
          </div>

          <section className="space-y-10" aria-labelledby="community-links-heading">
            <h2 id="community-links-heading" className="sr-only">
              Link categories
            </h2>
            {COMMUNITY_LINK_GROUPS.map((group) => {
              const items = communityLinksByCategory(group.key);
              if (items.length === 0) return null;
              return (
                <div key={group.key}>
                  <h3 className="text-xs font-black uppercase tracking-wide text-[#F9A8D4]">
                    {group.label}
                  </h3>
                  <p className="mt-1 text-[11px] text-[#E9D5FF]/65">{group.hint}</p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item, i) => (
                      <li key={item.id}>
                        <LinkCard item={item} index={i} ageVerified={ageVerified} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>

          <p className="mt-12 rounded-2xl border border-dashed border-[var(--theme-primary)]/40 bg-[var(--theme-surface)]/40 p-4 text-[11px] leading-relaxed text-[#E9D5FF]/75">
            18+ only. Third-party sites have their own terms, age checks, and content policies. We do not
            endorse illegal material; report issues to the host site. Suggest a listing via{" "}
            <Link href="/submit" className="font-bold text-[#FF4D8D] underline">
              Submit game
            </Link>{" "}
            (for games on our catalog) or edit the curated list in-repo for community hubs.
          </p>
        </main>

        <SiteFooter ageVerified={ageVerified} />
      </div>
    </>
  );
}
