"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CreatorsNavMenu } from "@/components/site/CreatorsNavMenu";
import { DroidMark } from "@/components/site/DroidMark";
import type { ThemeDecorFiles } from "@/lib/themes/asset-url";
import { ThemeAssetImage } from "@/components/theme/ThemeAssetImage";

type Props = {
  listingCount: number;
  ageVerified: boolean;
  themeAssets?: ThemeDecorFiles | null;
};

export function SiteHeader({ listingCount, ageVerified, themeAssets }: Props) {
  const pathname = usePathname();
  const shopNavActive = pathname === "/shop" || pathname.startsWith("/shop/");
  const { configured, loading, user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

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

  const signInLinkClass =
    "rounded-full border border-[var(--theme-primary)]/40 px-3 py-2 text-[10px] font-bold text-[var(--theme-accent)] hover:bg-[var(--theme-surface)]";
  const signInLinkMobileClass =
    "inline-flex min-h-[44px] items-center rounded-full border border-[var(--theme-primary)]/40 px-2.5 py-2 text-[10px] font-bold text-[var(--theme-accent)]";

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
          <Link href="/" className="rounded-full px-3 py-2 hover:bg-[var(--theme-surface)]">
            Home
          </Link>
          <Link href="/new" className="rounded-full px-3 py-2 hover:bg-[var(--theme-surface)]">
            New
          </Link>
          <Link href="/browse" className="rounded-full px-3 py-2 hover:bg-[var(--theme-surface)]">
            Browse
          </Link>
          <Link
            href="/shop"
            className={`rounded-full px-3 py-2 hover:bg-[var(--theme-surface)] ${
              shopNavActive ? "bg-[var(--theme-surface)] text-[var(--foreground)]" : ""
            }`}
          >
            Shop
          </Link>
          <Link href="/videos" className="rounded-full px-3 py-2 hover:bg-[var(--theme-surface)]">
            Videos
          </Link>
          <CreatorsNavMenu variant="desktop" />
          <Link href="/submit" className="rounded-full px-3 py-2 hover:bg-[var(--theme-surface)]">
            Submit game
          </Link>
          {!loading && configured && user ? (
            <Link href="/settings" className="rounded-full px-3 py-2 hover:bg-[var(--theme-surface)]">
              Settings
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto hidden flex-wrap items-center gap-2 md:flex">
          {gameCountBadge}
          {user ? (
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
          ) : (
            <Link href="/sign-in" className={signInLinkClass} title={configured ? undefined : "Sign-in needs Firebase env on the server build"}>
              Sign in
            </Link>
          )}
        </div>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 md:hidden">
          {user ? (
            <Link
              href="/account"
              className="inline-flex min-h-[44px] max-w-[5.5rem] items-center truncate rounded-full border border-[var(--theme-primary)]/40 px-2 py-2 text-[10px] font-bold text-[var(--theme-text-muted)]"
            >
              Account
            </Link>
          ) : (
            <Link href="/sign-in" className={signInLinkMobileClass}>
              Sign in
            </Link>
          )}
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
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center rounded-xl px-3 hover:bg-[var(--theme-surface)]"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/new"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center rounded-xl px-3 hover:bg-[var(--theme-surface)]"
              >
                New
              </Link>
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
                href="/shop"
                onClick={() => setMenuOpen(false)}
                className={`flex min-h-[44px] w-full items-center rounded-xl px-3 hover:bg-[var(--theme-surface)] ${
                  shopNavActive ? "bg-[var(--theme-surface)] text-[var(--foreground)]" : ""
                }`}
              >
                Shop
              </Link>
            </li>
            <li>
              <Link
                href="/videos"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center rounded-xl px-3 hover:bg-[var(--theme-surface)]"
              >
                Videos
              </Link>
            </li>
            <CreatorsNavMenu variant="mobile" onNavigate={() => setMenuOpen(false)} />
            <li>
              <Link
                href="/submit"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center rounded-xl px-3 hover:bg-[var(--theme-surface)]"
              >
                Submit game
              </Link>
            </li>
            {user ? (
              <li>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] w-full items-center rounded-xl px-3 hover:bg-[var(--theme-surface)]"
                >
                  Settings
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  href="/sign-in"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] w-full items-center rounded-xl px-3 hover:bg-[var(--theme-surface)]"
                >
                  Sign in
                </Link>
              </li>
            )}
          </ul>
          <div className="mt-4 flex flex-col gap-3 border-t border-[var(--theme-primary)]/20 pt-4">
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
