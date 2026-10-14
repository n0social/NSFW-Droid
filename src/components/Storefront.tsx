"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Listing } from "@/db/schema";
import { GameCard } from "./GameCard";
import { AgeGate } from "./AgeGate";
import { HeroCarousel } from "./HeroCarousel";
import { ChipRow, type ChipId } from "./ChipRow";
import { SiteHeader } from "./site/SiteHeader";
import { SiteFooter } from "./site/SiteFooter";

type Props = {
  ageVerified: boolean;
  blurCovers: boolean;
  topGrossing: Listing[];
  newReleases: Listing[];
  all: Listing[];
  listingCount: number;
  rankingsFromAnalytics?: boolean;
};

function matchesChip(game: Listing, chip: ChipId) {
  if (chip === "all") return true;
  if (chip === "new") return game.chartBucket !== "top_grossing";
  const plats = (game.platforms ?? []).map((p) => p.toLowerCase());
  return plats.includes(chip);
}

export function Storefront({
  ageVerified,
  blurCovers: initialBlur,
  topGrossing,
  newReleases,
  all,
  listingCount,
  rankingsFromAnalytics = false,
}: Props) {
  const [blurCovers, setBlurCovers] = useState(initialBlur);
  const [chip, setChip] = useState<ChipId>("all");

  const forceBlur = !ageVerified;
  const effectiveBlur = forceBlur || blurCovers;

  const filteredHot = useMemo(
    () => topGrossing.filter((g) => matchesChip(g, chip)),
    [topGrossing, chip],
  );
  const filteredNew = useMemo(
    () => newReleases.filter((g) => matchesChip(g, chip)),
    [newReleases, chip],
  );

  const featured = topGrossing[0] ?? all[0] ?? null;

  const hotTitle = rankingsFromAnalytics ? "Hottest this week" : "Top picks";
  const newTitle = rankingsFromAnalytics ? "Trending now" : "New releases";

  async function toggleBlur() {
    if (!ageVerified) return;
    const next = !blurCovers;
    setBlurCovers(next);
    await fetch("/api/blur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
  }

  const blurToggle = (
    <button
      type="button"
      onClick={toggleBlur}
      disabled={!ageVerified}
      title={
        !ageVerified
          ? "Confirm age to change blur"
          : "Toggle cover blur for testing"
      }
      className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold ${
        effectiveBlur
          ? "bg-[var(--theme-accent)] text-[var(--foreground)]"
          : "border-2 border-[var(--theme-primary)] text-[var(--theme-text-muted)]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      Blur: {effectiveBlur ? "ON" : "OFF"}
    </button>
  );

  return (
    <>
      <AgeGate open={!ageVerified} />

      <div className={!ageVerified ? "pointer-events-none select-none" : ""}>
        <SiteHeader listingCount={listingCount} blurToggle={blurToggle} ageVerified={ageVerified} />

        <main id="browse" className="mx-auto max-w-7xl px-4 pb-4 pt-4">
          <HeroCarousel featured={featured} blur={effectiveBlur} />
          <ChipRow active={chip} onChange={setChip} />

          {listingCount === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--theme-primary)]/50 p-12 text-center">
              <p className="font-bold text-[var(--theme-text-muted)]">No live listings yet.</p>
              <p className="mt-2 text-xs text-[var(--theme-text-muted)]/80">
                Run ingest on the server, then approve titles in{" "}
                <Link href="/admin" className="text-[#FF4D8D] underline">
                  admin
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              {filteredHot.length > 0 && (
                <section className="mb-8">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-black text-[#FFF1F7]">{hotTitle}</h2>
                    <span className="text-[10px] font-bold text-[#FF4D8D]">See all</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                    {filteredHot.map((g, i) => (
                      <GameCard
                        key={g.id}
                        game={g}
                        index={i}
                        rank={g.chartRank ?? i + 1}
                        blur={effectiveBlur}
                      />
                    ))}
                  </div>
                </section>
              )}

              {filteredNew.length > 0 && (
                <section className="mb-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-black text-[#FFF1F7]">{newTitle}</h2>
                    <span className="text-[10px] font-bold text-[#FF4D8D]">See all</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                    {filteredNew.map((g, i) => (
                      <GameCard key={g.id} game={g} index={i + 2} blur={effectiveBlur} />
                    ))}
                  </div>
                </section>
              )}

              {filteredHot.length === 0 && filteredNew.length === 0 && (
                <p className="py-8 text-center text-sm text-[#E9D5FF]/80">
                  No titles match this filter. Try another platform chip.
                </p>
              )}

              <p className="mt-6 text-center text-[10px] font-semibold text-[#E9D5FF]/70">
                {rankingsFromAnalytics
                  ? "Rankings from on-site clicks and views."
                  : "Rankings update as visitors browse and click through to stores."}
              </p>
            </>
          )}
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
