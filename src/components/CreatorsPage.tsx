"use client";

import Link from "next/link";
import {
  CURATED_GAME_STORES,
  CURATED_STUDIO_GROUPS,
  CURATED_GAMES,
  gamesByStore,
  studiosByGroup,
  type CuratedGame,
  type CuratedStudio,
} from "@/lib/creators-curated";
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

function storeLabel(store: CuratedGame["store"]): string {
  return CURATED_GAME_STORES.find((s) => s.key === store)?.label ?? store;
}

/** CTA line on studio cards — matches href host (Steam publisher vs itch vs Patreon). */
function studioOutboundLabel(href: string): string {
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    if (host === "store.steampowered.com") return "Steam publisher →";
    if (host === "itch.io" || host.endsWith(".itch.io")) return "itch.io →";
    if (host === "patreon.com") return "Patreon →";
    if (host === "nutaku.net") return "Nutaku →";
  } catch {
    /* invalid href falls through */
  }
  return "Official site →";
}

function StudioCard({ studio, index }: { studio: CuratedStudio; index: number }) {
  const initial = studio.name.trim().charAt(0).toUpperCase();
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <article
      className="flex h-full flex-col rounded-2xl border border-[var(--theme-primary)]/25 bg-[var(--theme-surface)]/70 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
    >
      <a
        href={studio.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-1 flex-col p-4 sm:p-5"
        aria-label={`Visit ${studio.name} (opens in new tab)`}
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
              {studio.name}
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[#E9D5FF]/80">{studio.blurb}</p>
          </div>
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[#FF4D8D]">
          {studioOutboundLabel(studio.href)}
        </p>
      </a>
    </article>
  );
}

function GameCard({ game, index }: { game: CuratedGame; index: number }) {
  const initial = game.title.trim().charAt(0).toUpperCase();
  const gradient = CARD_GRADIENTS[(index + 1) % CARD_GRADIENTS.length];

  return (
    <article
      className="flex h-full flex-col rounded-2xl border border-[var(--theme-primary)]/25 bg-[#241033]/90 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
    >
      <a
        href={game.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-1 flex-col p-4 sm:p-5"
        aria-label={`Open ${game.title} on ${storeLabel(game.store)} (new tab)`}
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
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-[#FFF1F7] group-hover:text-[#FF4D8D]">
                {game.title}
              </h3>
              <span className="rounded-full border border-[#C026D3]/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#F9A8D4]">
                {game.genre}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#E9D5FF]/80">{game.blurb}</p>
          </div>
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[#FF4D8D]">
          {storeLabel(game.store)} →
        </p>
      </a>
    </article>
  );
}

export function CreatorsPage({
  ageVerified,
  listingCount,
  themeAssets = null,
  layoutDecor = [],
}: Props) {
  const studioCount = CURATED_STUDIO_GROUPS.reduce(
    (n, g) => n + studiosByGroup(g.key).length,
    0,
  );
  const gameCount = CURATED_GAMES.length;

  return (
    <>
      <div className="relative z-[1]">
        {layoutDecor.length > 0 && <ThemeLayoutDecor items={layoutDecor} />}
        <SiteHeader listingCount={listingCount} ageVerified={ageVerified} themeAssets={themeAssets} />

        <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 md:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF4D8D]">
              Curated link-outs
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#FFF1F7] sm:text-3xl">Creators</h1>
            <p className="mt-2 text-xs leading-relaxed text-[#E9D5FF]/85">
              Hand-picked adult game studios and landmark titles on official storefronts. NSFW Droid
              does not host these projects — every card opens the publisher or store in a new tab.
              Listings here are editorial, not exhaustive; browse our{" "}
              <Link href="/browse" className="font-bold text-[#FF4D8D] underline">
                catalog
              </Link>{" "}
              for titles we ingest automatically.
            </p>
            <p className="mt-2 text-[10px] font-semibold text-[#E9D5FF]/55">
              {studioCount} studios · {gameCount} spotlight games · updated in{" "}
              <code className="text-[9px]">src/lib/creators-curated.ts</code>
            </p>
          </div>

          <section className="space-y-10" aria-labelledby="creators-studios-heading">
            <div>
              <h2 id="creators-studios-heading" className="text-lg font-black text-[#FFF1F7]">
                Studios
              </h2>
              <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                Publishers, long-running teams, and official creator hubs.
              </p>
            </div>

            {CURATED_STUDIO_GROUPS.map((group) => {
              const items = studiosByGroup(group.key);
              if (items.length === 0) return null;
              return (
                <div key={group.key}>
                  <h3 className="text-xs font-black uppercase tracking-wide text-[#F9A8D4]">
                    {group.label}
                  </h3>
                  <p className="mt-1 text-[11px] text-[#E9D5FF]/65">{group.hint}</p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((studio, i) => (
                      <li key={studio.id}>
                        <StudioCard studio={studio} index={i} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>

          <section className="mt-14 space-y-10" aria-labelledby="creators-games-heading">
            <div>
              <h2 id="creators-games-heading" className="text-lg font-black text-[#FFF1F7]">
                Notable games
              </h2>
              <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                Fan-favorite titles grouped by primary storefront — for discovery outside our
                catalog rails.
              </p>
            </div>

            {CURATED_GAME_STORES.map((store) => {
              const items = gamesByStore(store.key);
              if (items.length === 0) return null;
              return (
                <div key={store.key}>
                  <h3 className="text-xs font-black uppercase tracking-wide text-[#F9A8D4]">
                    {store.label}
                  </h3>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((game, i) => (
                      <li key={game.id}>
                        <GameCard game={game} index={i} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>

          <p className="mt-12 rounded-2xl border border-dashed border-[var(--theme-primary)]/40 bg-[var(--theme-surface)]/40 p-4 text-[11px] leading-relaxed text-[#E9D5FF]/75">
            Outbound links may include affiliate parameters when programs are enabled. Purchases and
            content policies are always handled by the partner store — see our{" "}
            <Link href="/affiliate" className="font-bold text-[#FF4D8D] underline">
              affiliate disclosure
            </Link>
            .
          </p>
        </main>

        <SiteFooter ageVerified={ageVerified} />
      </div>
    </>
  );
}
