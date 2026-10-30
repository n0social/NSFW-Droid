"use client";

import Link from "next/link";
import { useState } from "react";
import { DroidMark } from "@/components/site/DroidMark";

const SHOP_CHIPS = ["All", "Merch", "Digital", "Bundles"] as const;

const PLACEHOLDER_PRODUCTS = [
  {
    title: "Vesper sticker pack v1",
    price: "$12.00 USD",
    pill: "Ships worldwide",
    mock: "STK",
  },
  {
    title: "NSFW Droid wordmark tee",
    price: "$28.00 USD",
    pill: "Merch",
    mock: "TEE",
  },
  {
    title: "Vesper 4K wallpaper pack",
    price: "$8.00 USD",
    pill: "Instant download",
    mock: "ZIP",
  },
] as const;

function ProductCard({
  title,
  price,
  pill,
  mock,
}: {
  title: string;
  price: string;
  pill: string;
  mock: string;
}) {
  return (
    <article className="flex flex-col gap-2 rounded-2xl border-2 border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 transition-transform hover:scale-[1.02] hover:border-[var(--theme-accent)]/60">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--background)]">
        <span className="absolute left-2 top-2 rounded-full border border-[var(--theme-primary)]/40 bg-[var(--theme-surface)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--theme-text-muted)]">
          {pill}
        </span>
        <div className="flex h-full items-center justify-center text-sm font-bold text-[var(--theme-text-muted)]">
          {mock}
        </div>
      </div>
      <h3 className="line-clamp-2 text-sm font-bold text-[var(--foreground)]">{title}</h3>
      <p className="text-sm font-bold tabular-nums text-[var(--theme-primary)]">{price}</p>
    </article>
  );
}

export function ShopLayoutMockup() {
  const [chip, setChip] = useState<(typeof SHOP_CHIPS)[number]>("All");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
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
          <nav className="ml-4 hidden gap-1 text-[11px] font-bold text-[var(--theme-text-muted)] sm:flex" aria-label="Primary">
            <span className="rounded-full px-3 py-2">Browse</span>
            <span className="rounded-full bg-[var(--theme-surface)] px-3 py-2 text-[var(--foreground)]">Shop</span>
            <span className="rounded-full px-3 py-2">Submit</span>
          </nav>
          <span className="ml-auto rounded-full border border-[var(--theme-primary)]/40 px-3 py-1.5 text-[10px] font-bold text-[var(--theme-accent)]">
            Sign in
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="mb-6 rounded-xl border border-[var(--theme-primary)]/30 bg-[var(--theme-surface)] px-4 py-3 text-center text-xs font-semibold text-[var(--theme-text-muted)]">
          Design mockup — not wired to cart, checkout, or inventory.
        </p>

        <section className="mb-8 overflow-hidden rounded-2xl border-2 border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <div className="relative aspect-[16/9] max-h-[360px] w-full bg-[var(--background)]">
            <div className="absolute inset-0 flex items-end gap-4 p-4 md:p-6">
              <div
                className="hidden h-32 w-24 shrink-0 rounded-lg border border-dashed border-[var(--theme-primary)]/40 bg-[var(--theme-surface)] sm:block"
                aria-hidden
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-lg font-black md:text-xl">Official NSFW Droid goods</p>
                <p className="text-sm text-[var(--theme-text-muted)]">
                  Support the catalog — wear the droid. Stickers, wallpapers, wear.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--theme-primary)] px-4 py-2 text-xs font-extrabold text-[var(--background)]">
                    Browse merch
                  </span>
                  <span className="rounded-full border border-[var(--theme-primary)]/40 px-4 py-2 text-xs font-extrabold text-[var(--theme-text-muted)]">
                    Digital packs
                  </span>
                </div>
              </div>
              <span className="absolute right-3 top-3 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 py-1 text-[9px] font-bold uppercase text-[var(--theme-text-muted)]">
                16:9 banner ref
              </span>
            </div>
          </div>
        </section>

        <div
          className="chip-scroll mb-8 flex gap-2 overflow-x-auto pb-2"
          role="toolbar"
          aria-label="Shop collections"
        >
          {SHOP_CHIPS.map((label) => {
            const active = chip === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setChip(label)}
                className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full px-4 py-2 text-xs font-extrabold ${
                  active
                    ? "bg-[var(--theme-primary)] text-[var(--foreground)]"
                    : "border border-[var(--theme-primary)]/40 text-[var(--theme-text-muted)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-[var(--theme-text-muted)]">
            Featured deal
          </h2>
          <div className="grid gap-4 rounded-2xl border-2 border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 md:grid-cols-[auto_1fr] md:items-center">
            <div className="mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-[#C026D3]/60 bg-[var(--background)] text-center">
              <span className="text-[10px] font-black uppercase text-[var(--foreground)]">DEAL</span>
              <span className="text-[9px] font-bold text-[var(--theme-text-muted)]">chibi</span>
            </div>
            <div>
              <p className="font-bold">Supporter bundle</p>
              <p className="mt-1 text-sm text-[var(--theme-text-muted)]">
                Sticker pack + wallpaper ZIP. Placeholder for{" "}
                <code className="text-[11px]">vesper-chibi-deal-big-bust-banner-v2.jpg</code>.
              </p>
              <p className="mt-2 font-bold tabular-nums text-[var(--theme-primary)]">$17.00 USD</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-[var(--theme-text-muted)]">
            Grid preview
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {PLACEHOLDER_PRODUCTS.map((p) => (
              <ProductCard key={p.title} {...p} />
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-[var(--theme-text-muted)]">
          Collection, PDP, cart drawer, and checkout shells — see interactive canvas and{" "}
          <span className="font-semibold">docs/shop-layout-mockups.md</span>.
        </p>
      </main>
    </div>
  );
}
