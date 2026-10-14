"use client";

import type { Listing } from "@/db/schema";

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
};

function platformLabel(game: Listing) {
  const plats = (game.platforms ?? []).join(" · ") || "PC";
  const src =
    game.source === "steam"
      ? "Steam"
      : game.source === "affiliate_export"
        ? "Partner"
        : game.source === "developer_form"
          ? "Developer"
          : "itch.io";
  return `${plats} · ${src}`;
}

export function GameCard({ game, index, rank, wide, blur }: Props) {
  const w = wide ? "w-[200px]" : "w-[140px]";
  const h = wide ? "h-[200px]" : "h-[168px]";

  return (
    <a
      href={game.officialUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${w} shrink-0 overflow-hidden rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.45)] bg-[#241033] block`}
    >
      <div className={`relative ${h}`} style={{ background: gradients[index % gradients.length] }}>
        {rank !== undefined && (
          <span
            className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-lg text-xs font-black shadow-md"
            style={{
              background: rank === 1 ? "#FBBF24" : rank === 2 ? "#E5E7EB" : rank === 3 ? "#D97706" : "#C026D3",
              color: rank === 2 ? "#14061C" : "#FFF1F7",
            }}
          >
            #{rank}
          </span>
        )}
        <div
          className={`absolute inset-0 flex items-end p-3 transition-[filter] duration-300 ${blur ? "blur-xl scale-105" : ""}`}
        >
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#14061Cee] via-transparent to-transparent"
            aria-hidden
          />
          <span className="relative z-10 text-xs font-extrabold leading-tight text-[#FFF1F7] line-clamp-3">
            {game.title}
          </span>
        </div>
        {blur && (
          <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold text-[#F9A8D4]">
            Blurred
          </span>
        )}
      </div>
      <div className="px-2.5 py-2 text-[10px] font-bold text-[#E9D5FF]">
        {platformLabel(game)}
      </div>
    </a>
  );
}
