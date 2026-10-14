"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { DroidMark } from "@/components/site/DroidMark";

type Props = {
  listingCount: number;
  blurToggle?: React.ReactNode;
  ageVerified: boolean;
};

export function SiteHeader({ listingCount, blurToggle, ageVerified }: Props) {
  const { configured, loading, user, signOut } = useAuth();

  function scrollBrowse() {
    document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-[var(--theme-primary)]/35 bg-[var(--background)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="NSFW Droid home">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--theme-surface)] shadow-md ring-1 ring-[var(--theme-primary)]/50">
            <DroidMark className="h-8 w-8" />
          </span>
          <span className="text-sm font-black tracking-tight text-[var(--foreground)]">
            NSFW<span className="text-[var(--theme-accent)]">Droid</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-[11px] font-bold text-[var(--theme-text-muted)] sm:flex">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="rounded-full px-3 py-1.5 hover:bg-[var(--theme-surface)]"
          >
            New
          </button>
          <button
            type="button"
            onClick={scrollBrowse}
            className="rounded-full px-3 py-1.5 hover:bg-[var(--theme-surface)]"
          >
            Browse
          </button>
          <Link href="/submit" className="rounded-full px-3 py-1.5 hover:bg-[var(--theme-surface)]">
            Submit game
          </Link>
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {blurToggle}
          <span
            className="rounded-full border border-[var(--theme-primary)]/40 px-3 py-1.5 text-[10px] font-bold text-[var(--theme-text-muted)]"
            title="Published titles in catalog"
          >
            {listingCount.toLocaleString()} games
          </span>
          {!loading && configured && user ? (
            <>
              <Link
                href="/account"
                className="rounded-full border border-[var(--theme-primary)]/40 px-3 py-1.5 text-[10px] font-bold text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)]"
              >
                Account
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="hidden rounded-full border border-[var(--theme-surface)] px-3 py-1.5 text-[10px] font-semibold text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)] sm:inline"
              >
                Sign out
              </button>
            </>
          ) : !loading && configured ? (
            <Link
              href="/sign-in"
              className="rounded-full border border-[var(--theme-primary)]/40 px-3 py-1.5 text-[10px] font-bold text-[var(--theme-accent)] hover:bg-[var(--theme-surface)]"
            >
              Sign in
            </Link>
          ) : (
            <span
              className="hidden rounded-full border border-[var(--theme-surface)] px-3 py-1.5 text-[10px] font-semibold text-[var(--theme-text-muted)]/40 sm:inline"
              title="Set Firebase env vars to enable accounts"
            >
              Sign in — soon
            </span>
          )}
        </div>
      </div>
      {!ageVerified && (
        <p className="bg-[var(--theme-accent)]/15 px-4 py-1.5 text-center text-[10px] font-bold text-[var(--theme-accent)]">
          18+ verification required before unblurred covers.
        </p>
      )}
    </header>
  );
}
