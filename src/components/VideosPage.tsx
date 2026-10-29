"use client";

import Link from "next/link";
import { effectiveCoverBlur } from "@/lib/cover-blur";
import { AgeGate } from "./AgeGate";
import { VesperWelcomeCard } from "./VesperWelcomeCard";
import { SiteHeader } from "./site/SiteHeader";
import { SiteFooter } from "./site/SiteFooter";
import { VideoCard } from "./VideoCard";
import type { VideosResult } from "@/lib/video-feeds";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import type { ResolvedLayoutDecorItem } from "@/lib/themes/types";
import { ThemeLayoutDecor } from "@/components/theme/ThemeLayoutDecor";

type Props = {
  ageVerified: boolean;
  blurCovers: boolean;
  listingCount: number;
  data: VideosResult;
  themeAssets?: ThemeDecorFiles | null;
  layoutDecor?: ResolvedLayoutDecorItem[];
};

export function VideosPage({
  ageVerified,
  blurCovers,
  listingCount,
  data,
  themeAssets = null,
  layoutDecor = [],
}: Props) {
  const effectiveBlur = effectiveCoverBlur(ageVerified, blurCovers);
  const anyOk = data.sources.some((s) => s.ok);

  return (
    <>
      <AgeGate open={!ageVerified} />
      <VesperWelcomeCard ageVerified={ageVerified} />
      <div className={`relative z-[1] ${!ageVerified ? "pointer-events-none select-none" : ""}`}>
        {layoutDecor.length > 0 && <ThemeLayoutDecor items={layoutDecor} />}
        <SiteHeader
          listingCount={listingCount}
          ageVerified={ageVerified}
          themeAssets={themeAssets}
        />

        <main className="mx-auto max-w-7xl px-4 pb-8 pt-4 md:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF4D8D]">
              Link-out catalog
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#FFF1F7] sm:text-3xl">Top videos</h1>
            <p className="mt-2 max-w-2xl text-xs text-[#E9D5FF]/85">
              Popular clips from SFM Compile (by on-site views), refreshed on a separate schedule
              from the home page &ldquo;Recent videos&rdquo; rail. NSFW Droid does not host video
              files — every card opens the publisher in a new tab.
            </p>
          </div>

          {!anyOk && data.items.length === 0 && (
            <div
              role="status"
              className="rounded-2xl border-2 border-dashed border-[var(--theme-primary)]/50 p-10 text-center"
            >
              <p className="font-bold text-[var(--theme-text-muted)]">Feeds unavailable right now</p>
              <p className="mt-2 text-xs text-[var(--theme-text-muted)]/80">
                RSS sources are configured but could not be reached. See{" "}
                <Link href="/terms" className="text-[#FF4D8D] underline">
                  terms
                </Link>{" "}
                and <code className="text-[10px]">docs/video-section.md</code> in the repo for
                source policy.
              </p>
              {data.sources.length > 0 && (
                <ul className="mt-4 space-y-1 text-left text-[10px] text-[#E9D5FF]/70">
                  {data.sources.map((s) => (
                    <li key={s.id}>
                      <span className="font-bold">{s.label}</span>:{" "}
                      {s.ok ? "OK" : s.error ?? "error"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {data.items.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((video, i) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  index={i}
                  blur={effectiveBlur}
                  ageVerified={ageVerified}
                />
              ))}
            </div>
          )}

          <p className="mt-8 text-center text-[10px] font-semibold text-[#E9D5FF]/60">
            Thumbnails and playback stay on the publisher&apos;s site. No embeds or proxied media on
            NSFW Droid.
          </p>
        </main>

        <SiteFooter ageVerified={ageVerified} />
      </div>
    </>
  );
}
