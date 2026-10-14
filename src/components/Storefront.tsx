"use client";

import Link from "next/link";
import { useState } from "react";
import type { Listing } from "@/db/schema";
import { GameCard } from "./GameCard";
import { AgeGate } from "./AgeGate";

type Props = {
  ageVerified: boolean;
  blurCovers: boolean;
  topGrossing: Listing[];
  newReleases: Listing[];
  rankingsFromAnalytics?: boolean;
};

export function Storefront({
  ageVerified,
  blurCovers: initialBlur,
  topGrossing,
  newReleases,
  rankingsFromAnalytics = false,
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

  const hotTitle = rankingsFromAnalytics ? "Hottest this week" : "Top picks";
  const newTitle = rankingsFromAnalytics ? "Trending now" : "New releases";

  return (
    <>
      <AgeGate open={!ageVerified} />

      <div className={!ageVerified ? "pointer-events-none select-none" : ""}>
        <header className="sticky top-0 z-50 flex flex-wrap items-center gap-3 border-b-2 border-[#C026D3]/30 bg-[#14061C]/90 px-4 py-3 backdrop-blur-md">
          <Link href="/" className="text-sm font-black text-[#FFF1F7]">
            ♥ Store
          </Link>
          <nav className="flex gap-2 text-[10px] font-bold">
            <Link
              href="/submit"
              className="rounded-full border border-[#C026D3]/50 px-3 py-1.5 text-[#E9D5FF] hover:border-[#FF4D8D]"
            >
              Submit game
            </Link>
          </nav>
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
                Run <code className="text-[#F9A8D4]">npm run db:migrate</code> and{" "}
                <code className="text-[#F9A8D4]">npm run ingest</code>, then approve candidates in{" "}
                <Link href="/admin" className="text-[#FF4D8D] underline">
                  admin
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <section className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-black text-[#FFF1F7]">{hotTitle}</h2>
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
                  <h2 className="text-sm font-black text-[#FFF1F7]">{newTitle}</h2>
                  <span className="text-[10px] font-bold text-[#FF4D8D]">See all</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {newReleases.map((g, i) => (
                    <GameCard key={g.id} game={g} index={i + 2} blur={effectiveBlur} />
                  ))}
                </div>
              </section>

              <p className="mt-8 text-center text-[10px] font-semibold text-[#E9D5FF]/70">
                {rankingsFromAnalytics
                  ? "Rankings from on-site clicks and views — not store charts."
                  : "Approve ingest candidates in admin; rankings fill in as visitors play."}
              </p>
            </>
          )}
        </main>
      </div>
    </>
  );
}
