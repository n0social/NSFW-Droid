"use client";

import Link from "next/link";
import { VesperMark } from "@/components/site/VesperMark";

type Props = {
  listingCount: number;
  blurToggle?: React.ReactNode;
  ageVerified: boolean;
};

export function SiteHeader({ listingCount, blurToggle, ageVerified }: Props) {
  function scrollBrowse() {
    document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-[#C026D3]/35 bg-[#14061C]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="NSFW Droid home">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#241033] shadow-md ring-1 ring-[#C026D3]/50">
            <VesperMark className="h-8 w-8" />
          </span>
          <span className="text-sm font-black tracking-tight text-[#FFF1F7]">
            NSFW<span className="text-[#FF4D8D]">Droid</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-[11px] font-bold text-[#E9D5FF] sm:flex">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="rounded-full px-3 py-1.5 hover:bg-[#241033]"
          >
            New
          </button>
          <button
            type="button"
            onClick={scrollBrowse}
            className="rounded-full px-3 py-1.5 hover:bg-[#241033]"
          >
            Browse
          </button>
          <Link href="/submit" className="rounded-full px-3 py-1.5 hover:bg-[#241033]">
            Submit game
          </Link>
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {blurToggle}
          <span
            className="rounded-full border border-[#C026D3]/40 px-3 py-1.5 text-[10px] font-bold text-[#E9D5FF]"
            title="Published titles in catalog"
          >
            {listingCount.toLocaleString()} games
          </span>
          <span
            className="hidden rounded-full border border-[#241033] px-3 py-1.5 text-[10px] font-semibold text-[#E9D5FF]/40 sm:inline"
            title="Accounts ship in a later phase"
          >
            Sign in — soon
          </span>
        </div>
      </div>
      {!ageVerified && (
        <p className="bg-[#FF4D8D]/15 px-4 py-1.5 text-center text-[10px] font-bold text-[#F9A8D4]">
          18+ verification required before unblurred covers.
        </p>
      )}
    </header>
  );
}
