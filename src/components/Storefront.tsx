"use client";

import { useState } from "react";
import type { Listing } from "@/db/schema";
import { GameCard } from "./GameCard";
import { AgeGate } from "./AgeGate";

type Props = {
  ageVerified: boolean;
  blurCovers: boolean;
  topGrossing: Listing[];
  newReleases: Listing[];
};

export function Storefront({
  ageVerified,
  blurCovers: initialBlur,
  topGrossing,
  newReleases,
}: Props) {
  const [blurCovers, setBlurCovers] = useState(initialBlur);

  const forceBlur = !ageVerified;
  const effectiveBlur = forceBlur || blurCovers;

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

  return (
    <>
      <AgeGate open={!ageVerified} />

      <div className={!ageVerified ? "pointer-events-none select-none" : ""}>
        <header className="sticky top-0 z-50 flex flex-wrap items-center gap-3 border-b-2 border-[#C026D3]/30 bg-[#14061C]/90 px-4 py-3 backdrop-blur-md">
          <span className="text-sm font-black text-[#FFF1F7]">♥ Store</span>
          <span className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleBlur}
              disabled={!ageVerified}
              title={
                !ageVerified
                  ? "Confirm age to change blur (bypass protection stays on until verified)"
                  : "Toggle cover blur for testing"
              }
              className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold ${
                effectiveBlur
                  ? "bg-[#FF4D8D] text-[#FFF1F7]"
                  : "border-2 border-[#C026D3] text-[#E9D5FF]"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Blur covers: {effectiveBlur ? "ON" : "OFF"}
            </button>
            <span className="rounded-full border-2 border-[#C026D3]/50 px-3 py-1.5 text-[10px] font-bold text-[#E9D5FF]">
              ♥ 1,240
            </span>
            <span className="rounded-full border-2 border-[#C026D3] px-3 py-1.5 text-[10px] font-extrabold text-[#FFF1F7]">
              Sign in
            </span>
          </span>
        </header>

        {!ageVerified && (
          <p className="bg-[#FF4D8D]/20 px-4 py-2 text-center text-[10px] font-bold text-[#F9A8D4]">
            Covers stay blurred until you confirm you are 18+ (anti-bypass).
          </p>
        )}

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-4">
          {topGrossing.length === 0 && newReleases.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#C026D3]/50 p-12 text-center">
              <p className="font-bold text-[#E9D5FF]">No listings yet.</p>
              <p className="mt-2 text-xs text-[#E9D5FF]/80">
                Run: docker compose up -d && npm run db:push && npm run ingest:itch
              </p>
            </div>
          ) : (
            <>
              <section className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-black text-[#FFF1F7]">Top grossing</h2>
                  <span className="text-[10px] font-bold text-[#FF4D8D]">See all</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {topGrossing.map((g, i) => (
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

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-black text-[#FFF1F7]">New releases</h2>
                  <span className="text-[10px] font-bold text-[#FF4D8D]">See all</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {newReleases.map((g, i) => (
                    <GameCard key={g.id} game={g} index={i + 2} blur={effectiveBlur} />
                  ))}
                </div>
              </section>

              <p className="mt-8 text-center text-[10px] font-semibold text-[#E9D5FF]/70">
                Live data from itch.io RSS and Steam store API (titles + links). Covers blurred by default.
              </p>
            </>
          )}
        </main>
      </div>
    </>
  );
}
