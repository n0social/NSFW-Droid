"use client";

import { useEffect, useState } from "react";
import type { Listing } from "@/db/schema";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFavoritesContext } from "@/components/favorites/FavoritesProvider";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import { ThemeAssetImage } from "@/components/theme/ThemeAssetImage";

const gradients = [
  "linear-gradient(145deg, #4a1d6a 0%, #C026D3 45%, #14061C 100%)",
  "linear-gradient(145deg, #2d1b4e 0%, #FF4D8D 50%, #241033 100%)",
  "linear-gradient(160deg, #1a3a4a 0%, #7c3aed 40%, #14061C 100%)",
];

type Props = {
  game: Listing;
  index: number;
  rank?: number;
  wide?: boolean;
  blur: boolean;
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

export function GameCard({ game, index, rank, wide, blur, themeAssets }: Props) {
  const w = wide ? "w-[200px]" : "w-[140px]";
  const h = wide ? "h-[200px]" : "h-[168px]";
  const { user } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavoritesContext();
  const [coverFailed, setCoverFailed] = useState(false);
  const coverUrl = game.coverImageUrl?.trim() || null;
  const showCover = Boolean(coverUrl) && !coverFailed;

  useEffect(() => {
    setCoverFailed(false);
  }, [coverUrl]);

  useEffect(() => {
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: game.id, path: "/" }),
    }).catch(() => {});
  }, [game.id]);

  const favorited = favoriteIds.has(game.id);
  const gradient = gradients[index % gradients.length];

  return (
    <div
      className={`${w} shrink-0 overflow-hidden rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.45)] bg-[#241033] relative`}
    >
      {user && (
        <button
          type="button"
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggleFavorite(game.id);
          }}
          className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-base leading-none hover:bg-black/60"
        >
          {favorited ? "♥" : "♡"}
        </button>
      )}
      <a href={`/api/go/${game.id}`} className="block">
        <div
          className={`relative ${h}`}
          style={{ background: showCover ? undefined : gradient }}
        >
          {showCover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl!}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 ${blur ? "blur-xl scale-105" : ""}`}
              loading="lazy"
              decoding="async"
              onError={() => setCoverFailed(true)}
            />
          )}
          {rank !== undefined && (
            <span
              className="absolute left-2 top-2 z-10 flex h-7 min-w-7 items-center justify-center rounded-lg text-xs font-black shadow-md overflow-hidden"
              style={{
                background:
                  rank === 1 ? "#FBBF24" : rank === 2 ? "#E5E7EB" : rank === 3 ? "#D97706" : "#C026D3",
                color: rank === 2 ? "#14061C" : "#FFF1F7",
              }}
            >
              {themeAssets && rank <= 3 ? (
                <ThemeAssetImage
                  src={themeAssets.badge}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-35"
                />
              ) : null}
              <span className="relative z-[1]">#{rank}</span>
            </span>
          )}
          <div
            className={`absolute inset-0 z-[1] flex items-end p-3 transition-[filter] duration-300 ${blur && !showCover ? "blur-xl scale-105" : ""}`}
          >
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#14061Cee] via-transparent to-transparent"
              aria-hidden
            />
            <span className="relative z-10 text-xs font-extrabold leading-tight text-[#FFF1F7] line-clamp-3 drop-shadow-md">
              {game.title}
            </span>
          </div>
          {blur && (
            <span className="absolute right-2 top-2 z-20 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold text-[#F9A8D4]">
              Blurred
            </span>
          )}
        </div>
        <div className="px-2.5 py-2 text-[10px] font-bold text-[#E9D5FF]">
          {platformLabel(game)}
        </div>
      </a>
    </div>
  );
}
