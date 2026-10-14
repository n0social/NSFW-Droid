"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function AccountPage() {
  const router = useRouter();
  const { configured, loading, user, signOut } = useAuth();
  const [themeBusy, setThemeBusy] = useState(false);

  useEffect(() => {
    if (!loading && configured && !user) router.replace("/sign-in");
  }, [loading, configured, user, router]);

  async function removeHolidayTheme() {
    setThemeBusy(true);
    try {
      await fetch("/api/theme/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preference: "default" }),
      });
      router.refresh();
    } finally {
      setThemeBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-lg px-4 py-12">
        <Link href="/" className="text-xs font-bold text-[var(--theme-accent)]">← Store</Link>
        <h1 className="mt-4 text-2xl font-black">Account</h1>

        {loading ? (
          <p className="mt-4 text-sm text-[var(--theme-text-muted)]">Loading…</p>
        ) : !configured ? (
          <p className="mt-4 text-sm text-[var(--theme-text-muted)]">
            Firebase is not configured on this deployment.
          </p>
        ) : user ? (
          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border-2 border-[var(--theme-primary)]/40 bg-[var(--theme-surface)] p-5">
              <h2 className="text-xs font-black uppercase tracking-wide text-[var(--theme-text-muted)]">
                Signed in
              </h2>
              <p className="mt-2 text-sm font-bold">{user.email ?? user.uid}</p>
              <button
                type="button"
                onClick={() => signOut().then(() => router.push("/"))}
                className="mt-4 rounded-full border border-[var(--theme-primary)]/50 px-4 py-2 text-xs font-bold hover:bg-[var(--theme-primary)]/15"
              >
                Sign out
              </button>
            </section>

            <section className="rounded-2xl border-2 border-[var(--theme-primary)]/25 bg-[var(--theme-surface)]/60 p-5">
              <h2 className="text-xs font-black uppercase tracking-wide text-[var(--theme-text-muted)]">
                Favorites & subscription
              </h2>
              <p className="mt-2 text-sm text-[var(--theme-text-muted)]">
                Placeholder — wire Firestore or your API when you are ready.
              </p>
            </section>

            <section className="rounded-2xl border-2 border-[var(--theme-primary)]/25 bg-[var(--theme-surface)]/60 p-5">
              <h2 className="text-xs font-black uppercase tracking-wide text-[var(--theme-text-muted)]">
                Holiday theme
              </h2>
              <p className="mt-2 text-sm text-[var(--theme-text-muted)]">
                Opt out of seasonal colors while signed in (uses the{" "}
                <code className="text-[10px]">theme_override</code> cookie).
              </p>
              <button
                type="button"
                disabled={themeBusy}
                onClick={removeHolidayTheme}
                className="mt-3 rounded-full border border-[var(--theme-border-strong)] px-4 py-2 text-xs font-bold hover:bg-[var(--theme-primary)]/15 disabled:opacity-50"
              >
                Remove holiday theme
              </button>
            </section>
          </div>
        ) : null}
      </div>
      <SiteFooter />
    </div>
  );
}
