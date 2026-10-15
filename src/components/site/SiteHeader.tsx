"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { DroidMark } from "@/components/site/DroidMark";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import { ThemeAssetImage } from "@/components/theme/ThemeAssetImage";

type Props = {
  listingCount: number;
  blurToggle?: React.ReactNode;
  ageVerified: boolean;
  themeAssets?: ThemeDecorFiles | null;
};

export function SiteHeader({ listingCount, blurToggle, ageVerified, themeAssets }: Props) {
  const { configured, loading, user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  function scrollNew() {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const gameCountBadge = (
    <span
      className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--theme-primary)]/40 px-3 py-2 text-[11px] font-bold text-[var(--theme-text-muted)]"
      title="Published titles in catalog"
    >
      {listingCount.toLocaleString()} games
    </span>
  );

  return (
    <header className="relative sticky top-0 z-50 overflow-x-clip border-b-[3px] border-[var(--theme-primary)]/35 bg-[var(--background)]/95 backdrop-blur-md">
      {themeAssets && (
        <ThemeAssetImage
          src={themeAssets.decor}
          alt=""
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 h-8 w-full object-cover object-bottom opacity-70"
        />
      )}
      <div className="relative z-[1] mx-auto flex max-w-7xl min-w-0 items-center gap-1.5 px-3 py-2.5 sm:gap-2 sm:px-4 sm:py-3 md:gap-3">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2" aria-label="NSFW Droid home">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--theme-surface)] shadow-md ring-1 ring-[var(--theme-primary)]/50">
            <DroidMark className="h-8 w-8" />
          </span>
          <span className="truncate text-sm font-black tracking-tight text-[var(--foreground)]">
            NSFW<span className="text-[var(--theme-accent)]">Droid</span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 text-[11px] font-bold text-[var(--theme-text-muted)] md:flex"
          aria-label="Primary"
        >
          <button
            type="button"
            onClick={scrollNew}
            className="rounded-full px-3 py-2 hover:bg-[var(--theme-surface)]"
          >
            New
          </button>
          <Link href="/browse" className="rounded-full px-3 py-2 hover:bg-[var(--theme-surface)]">
            Browse
          </Link>
          <Link href="/submit" className="rounded-full px-3 py-2 hover:bg-[var(--theme-surface)]">
            Submit game
          </Link>
        </nav>

        <div className="ml-auto hidden flex-wrap items-center gap-2 md:flex">
          {blurToggle}
          {gameCountBadge}
          {!loading && configured && user ? (
            <>
              <Link
                href="/account"
                className="rounded-full border border-[var(--theme-primary)]/40 px-3 py-2 text-[10px] font-bold text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)]"
              >
                Account
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full border border-[var(--theme-surface)] px-3 py-2 text-[10px] font-semibold text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)]"
              >
                Sign out
              </button>
            </>
          ) : !loading && configured ? (
            <Link
              href="/sign-in"
              className="rounded-full border border-[var(--theme-primary)]/40 px-3 py-2 text-[10px] font-bold text-[var(--theme-accent)] hover:bg-[var(--theme-surface)]"
            >
              Sign in
            </Link>
          ) : (
            <span
              className="rounded-full border border-[var(--theme-surface)] px-3 py-2 text-[10px] font-semibold text-[var(--theme-text-muted)]/40"
              title="Set Firebase env vars to enable accounts"
            >
              Sign in — soon
            </span>
          )}
        </div>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 md:hidden">
          {!loading && configured && user ? (
            <Link
              href="/account"
              className="inline-flex min-h-[44px] max-w-[5.5rem] items-center truncate rounded-full border border-[var(--theme-primary)]/40 px-2 py-2 text-[10px] font-bold text-[var(--theme-text-muted)]"
            >
              Account
            </Link>
          ) : !loading && configured ? (
            <Link
              href="/sign-in"
              className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--theme-primary)]/40 px-2.5 py-2 text-[10px] font-bold text-[var(--theme-accent)]"
            >
              Sign in
            </Link>
          ) : null}
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--theme-primary)]/50 text-[var(--foreground)] hover:bg-[var(--theme-surface)]"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">{menuOpen ? "Close" : "Menu"}</span>
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id={menuId}
          className="relative z-[2] border-t border-[var(--theme-primary)]/25 bg-[var(--background)] px-4 py-4 md:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1 text-sm font-bold text-[var(--theme-text-muted)]">
            <li>
              <button
                type="button"
                onClick={scrollNew}
                className="flex min-h-[44px] w-full items-center rounded-xl px-3 hover:bg-[var(--theme-surface)]"
              >
                New
              </button>
            </li>
            <li>
              <Link
                href="/browse"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center rounded-xl px-3 hover:bg-[var(--theme-surface)]"
              >
                Browse
              </Link>
            </li>
            <li>
              <Link
                href="/submit"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center rounded-xl px-3 hover:bg-[var(--theme-surface)]"
              >
                Submit game
              </Link>
            </li>
          </ul>
          <div className="mt-4 flex flex-col gap-3 border-t border-[var(--theme-primary)]/20 pt-4">
            {blurToggle && (
              <div className="flex min-h-[44px] items-center [&_button]:min-h-[44px] [&_button]:text-[11px]">
                {blurToggle}
              </div>
            )}
            {gameCountBadge}
            {!loading && configured && user && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void signOut();
                }}
                className="min-h-[44px] rounded-xl border border-[var(--theme-surface)] px-3 text-left text-sm font-semibold hover:bg-[var(--theme-surface)]"
              >
                Sign out
              </button>
            )}
          </div>
        </nav>
      )}

      {!ageVerified && (
        <p className="bg-[var(--theme-accent)]/15 px-4 py-1.5 text-center text-[10px] font-bold text-[var(--theme-accent)]">
          18+ verification required before unblurred covers.
        </p>
      )}
    </header>
  );
}
