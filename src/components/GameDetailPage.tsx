"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Listing, Tag } from "@/db/schema";
import { AgeGate } from "@/components/AgeGate";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { displayListingTitle, listingCoverImageAlt } from "@/lib/listing-display";
import { listingHasAffiliateLink } from "@/lib/outbound-link";
import { GameCard } from "@/components/GameCard";
import { ListingReportPanel } from "@/components/ListingReportPanel";
import { gameListingPath } from "@/lib/listing-routes";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import { effectiveCoverBlur } from "@/lib/cover-blur";

const FALLBACK_GRADIENT =
  "linear-gradient(145deg, #4a1d6a 0%, #C026D3 45%, #14061C 100%)";

type Props = {
  listing: Listing;
  tags: Tag[];
  similarGames?: Listing[];
  ageVerified: boolean;
  blurCovers: boolean;
  listingCount: number;
  themeAssets?: ThemeDecorFiles | null;
};

function platformLabel(game: Listing) {
  const plats = (game.platforms ?? []).join(" · ") || "PC";
  const src =
    game.source === "steam"
      ? "Steam"
      : game.source === "manual"
        ? "Curated"
        : game.source === "developer_form"
          ? "Developer"
          : game.source === "affiliate_export"
            ? "Partner"
            : "itch.io";
  return `${plats} · ${src}`;
}

export function GameDetailPage({
  listing,
  tags,
  similarGames = [],
  ageVerified,
  blurCovers,
  listingCount,
  themeAssets = null,
}: Props) {
  const [coverFailed, setCoverFailed] = useState(false);

  const effectiveBlur = effectiveCoverBlur(ageVerified, blurCovers);
  const displayTitle = displayListingTitle(listing.title);
  const coverUrl = listing.coverImageUrl?.trim() || null;
  const showCover = Boolean(coverUrl) && !coverFailed;
  const showAffiliateDisclosure = listingHasAffiliateLink(listing);
  const storeLinkUnavailable = listing.linkStatus !== "ok";
  const playHref = `/api/go/${listing.id}`;

  useEffect(() => {
    setCoverFailed(false);
  }, [coverUrl]);

  useEffect(() => {
    if (!ageVerified) return;
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_id: listing.id,
        path: gameListingPath(listing.slug),
      }),
    }).catch(() => {});
  }, [ageVerified, listing.id, listing.slug]);

  return (
    <>
      <AgeGate open={!ageVerified} />
      <div
        className={`relative min-h-screen bg-[var(--background)] text-[var(--foreground)] ${!ageVerified ? "pointer-events-none select-none" : ""}`}
      >
        <SiteHeader
          listingCount={listingCount}
          ageVerified={ageVerified}
          themeAssets={themeAssets}
        />

        <main className="mx-auto min-w-0 max-w-7xl px-4 py-6 md:px-6">
          <Link
            href="/"
            className="pointer-events-auto inline-flex min-h-[44px] items-center text-xs font-bold text-[#FF4D8D] hover:underline"
          >
            ← Back to home
          </Link>

          <article className="pointer-events-auto mx-auto mt-4 max-w-3xl overflow-hidden rounded-2xl border border-[var(--theme-primary)]/30 bg-[#241033] shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
            <div
              className="relative aspect-[16/10] w-full sm:aspect-[2/1]"
              style={{ background: showCover ? "#14061C" : FALLBACK_GRADIENT }}
            >
              {showCover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl!}
                  alt={listingCoverImageAlt(displayTitle)}
                  className={`absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 ${effectiveBlur ? "scale-105 blur-xl" : ""}`}
                  onError={() => setCoverFailed(true)}
                />
              )}
              {effectiveBlur && (
                <span className="absolute right-3 top-3 z-20 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-[#F9A8D4]">
                  Blurred
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#14061Cee] via-[#14061C66] to-transparent" />
              <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6">
                <h1 className="text-xl font-black leading-tight text-[#FFF1F7] sm:text-3xl">
                  {displayTitle}
                </h1>
                <p className="mt-1 text-[11px] font-bold text-[#E9D5FF] sm:text-xs">
                  {platformLabel(listing)}
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              {storeLinkUnavailable && (
                <div
                  role="alert"
                  className="rounded-xl border border-amber-500/50 bg-amber-950/40 px-4 py-3 text-xs font-semibold text-amber-100"
                >
                  Store link may be unavailable. We could not verify the outbound URL recently — proceed
                  only if you trust the listing.
                </div>
              )}

              {tags.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/browse?tag=${encodeURIComponent(t.slug)}`}
                        className="inline-flex rounded-full border border-[#C026D3]/40 bg-[#14061C]/60 px-3 py-1 text-[10px] font-bold text-[#F9A8D4] hover:border-[#FF4D8D]"
                      >
                        {t.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-sm leading-relaxed text-[#E9D5FF]/90">
                This listing links out to the official storefront. Purchases and content policies are
                handled by the store — NSFW Droid does not host game files in Phase 1.
              </p>

              {showAffiliateDisclosure && (
                <p className="text-[11px] font-semibold text-[#E9D5FF]/60">
                  Outbound link may be an affiliate link. See{" "}
                  <Link href="/affiliate" className="text-[#FF4D8D] underline">
                    affiliate disclosure
                  </Link>
                  .
                </p>
              )}

              {storeLinkUnavailable ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="flex min-h-[48px] w-full cursor-not-allowed items-center justify-center rounded-full border-2 border-[#C026D3]/40 bg-[#241033] px-6 py-3 text-sm font-black text-[#E9D5FF]/50 sm:w-auto sm:inline-flex"
                  >
                    Play on store (link check failed)
                  </button>
                  <a
                    href={playHref}
                    className="inline-flex text-[11px] font-bold text-amber-200 underline hover:text-[#FF4D8D]"
                  >
                    Try store link anyway — may not work
                  </a>
                </div>
              ) : (
                <a
                  href={playHref}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#C026D3] px-6 py-3 text-sm font-black text-[#FFF1F7] shadow-lg hover:bg-[#FF4D8D] sm:w-auto sm:inline-flex"
                >
                  Play on store →
                </a>
              )}

              <ListingReportPanel
                listingId={listing.id}
                listingTitle={displayTitle}
                listingSlug={listing.slug}
              />
            </div>
          </article>

          {similarGames.length > 0 && (
            <section className="pointer-events-auto mt-10">
              <h2 className="mb-3 text-sm font-black text-[#FFF1F7]">Similar games</h2>
              <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-smooth snap-x snap-mandatory touch-pan-x md:mx-0 md:px-0">
                {similarGames.map((game, i) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    index={i}
                    blur={effectiveBlur}
                    ageVerified={ageVerified}
                    themeAssets={themeAssets}
                  />
                ))}
              </div>
            </section>
          )}
        </main>

        <SiteFooter ageVerified={ageVerified} />
      </div>
    </>
  );
}
