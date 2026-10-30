"use client";

import Link from "next/link";
import { DroidMark } from "@/components/site/DroidMark";
import { ShopHomeMain } from "@/components/shop/ShopHomeMain";

/** Standalone chrome for `/design/shop` — mirrors production IA without catalog SiteHeader. */
function ShopDesignHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-[var(--theme-primary)]/35 bg-[var(--background)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="NSFW Droid home">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--theme-surface)] ring-1 ring-[var(--theme-primary)]/50">
            <DroidMark className="h-8 w-8" />
          </span>
          <span className="text-sm font-black tracking-tight">
            NSFW<span className="text-[var(--theme-accent)]">Droid</span>
          </span>
        </Link>
        <nav
          className="ml-4 hidden gap-1 text-[11px] font-bold text-[var(--theme-text-muted)] sm:flex"
          aria-label="Primary"
        >
          <span className="rounded-full px-3 py-2">Browse</span>
          <span className="rounded-full bg-[var(--theme-surface)] px-3 py-2 text-[var(--foreground)]">Shop</span>
          <span className="rounded-full px-3 py-2">Submit</span>
        </nav>
        <span className="ml-auto rounded-full border border-[var(--theme-primary)]/40 px-3 py-1.5 text-[10px] font-bold text-[var(--theme-accent)]">
          Sign in
        </span>
      </div>
    </header>
  );
}

export function ShopLayoutMockup() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <ShopDesignHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <ShopHomeMain variant="design" />
      </main>
    </div>
  );
}
