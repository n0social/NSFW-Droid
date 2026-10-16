"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GameCard } from "@/components/GameCard";
import { SiteFooterClient } from "@/components/site/SiteFooterClient";
import { fetchAndSyncProfilePreferences } from "@/lib/sync-profile-preferences";
import type { Listing } from "@/db/schema";
import type { UserPreferences } from "@/db/schema";

type ProfilePayload = {
  email: string;
  display_name: string | null;
  newsletter_opt_in: boolean;
  preferences: UserPreferences;
};

export default function AccountPage() {
  const router = useRouter();
  const { configured, loading, user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [themePref, setThemePref] = useState<"default" | "auto">("auto");
  const [blurDefault, setBlurDefault] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [themeBusy, setThemeBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    setProfileLoading(true);
    try {
      const [profileRes, favRes] = await Promise.all([
        fetch("/api/account/profile"),
        fetch("/api/account/favorites?listings=1"),
      ]);
      if (profileRes.ok) {
        const data = await profileRes.json();
        const p = data.profile as ProfilePayload;
        setProfile(p);
        setDisplayName(p.display_name ?? "");
        setNewsletter(p.newsletter_opt_in);
        setThemePref(p.preferences?.theme_preference ?? "auto");
        setBlurDefault(p.preferences?.blur_covers ?? false);
      }
      if (favRes.ok) {
        const data = await favRes.json();
        setFavorites((data.favorites ?? []).map((f: { listing: Listing }) => f.listing));
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && configured && !user) router.replace("/sign-in");
  }, [loading, configured, user, router]);

  useEffect(() => {
    if (!user) return;
    void fetchAndSyncProfilePreferences();
    void loadAccount();
  }, [user, loadAccount]);

  async function saveProfile() {
    setSaveBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          newsletter_opt_in: newsletter,
          preferences: {
            theme_preference: themePref,
          },
        }),
      });
      if (!res.ok) {
        setError("Could not save profile.");
        return;
      }
      const data = await res.json();
      setProfile(data.profile);
      setMessage("Profile saved.");
    } finally {
      setSaveBusy(false);
    }
  }

  async function applyThemePreference(preference: "default" | "auto") {
    setThemePref(preference);
    setThemeBusy(true);
    try {
      await fetch("/api/theme/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preference }),
      });
      await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { theme_preference: preference } }),
      });
      router.refresh();
    } finally {
      setThemeBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 md:px-6">
        <Link href="/" className="text-xs font-bold text-[var(--theme-accent)]">← Store</Link>
        <h1 className="mt-4 text-2xl font-black">Account</h1>

        {loading ? (
          <p className="mt-4 text-sm text-[var(--theme-text-muted)]">Loading…</p>
        ) : !configured ? (
          <p className="mt-4 text-sm text-[var(--theme-text-muted)]">
            Accounts are not available on this deployment.
          </p>
        ) : user ? (
          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border-2 border-[var(--theme-primary)]/40 bg-[var(--theme-surface)] p-5">
              <h2 className="text-xs font-black uppercase tracking-wide text-[var(--theme-text-muted)]">
                Profile
              </h2>
              {profileLoading ? (
                <p className="mt-2 text-sm text-[var(--theme-text-muted)]">Loading profile…</p>
              ) : (
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-bold text-[var(--theme-text-muted)]">
                    Display name
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={80}
                      className="mt-1 w-full rounded-xl border-2 border-[var(--theme-primary)]/40 bg-[var(--background)] px-3 py-2 text-sm font-normal"
                    />
                  </label>
                  <p className="text-xs text-[var(--theme-text-muted)]">
                    Email{" "}
                    <span className="font-bold text-[var(--foreground)]">
                      {profile?.email ?? user.email ?? "—"}
                    </span>{" "}
                    (read-only)
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                    />
                    Email me occasional updates and deals
                  </label>
                  <button
                    type="button"
                    disabled={saveBusy}
                    onClick={() => void saveProfile()}
                    className="rounded-full bg-[var(--theme-primary)] px-4 py-2 text-xs font-black disabled:opacity-50"
                  >
                    Save profile
                  </button>
                </div>
              )}
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
                Favorites
              </h2>
              {favorites.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--theme-text-muted)]">
                  Tap ♡ on a game card while signed in to save favorites here.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
                  {favorites.map((g, i) => (
                    <GameCard key={g.id} game={g} index={i} layout="grid" blur={blurDefault} />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border-2 border-[var(--theme-primary)]/25 bg-[var(--theme-surface)]/60 p-5">
              <h2 className="text-xs font-black uppercase tracking-wide text-[var(--theme-text-muted)]">
                Preferences
              </h2>
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-xs font-bold text-[var(--theme-text-muted)]">Holiday theme</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={themeBusy}
                      onClick={() => void applyThemePreference("auto")}
                      className={`rounded-full px-4 py-2 text-xs font-bold ${
                        themePref === "auto"
                          ? "bg-[var(--theme-primary)]"
                          : "border border-[var(--theme-border-strong)]"
                      }`}
                    >
                      Seasonal (auto)
                    </button>
                    <button
                      type="button"
                      disabled={themeBusy}
                      onClick={() => void applyThemePreference("default")}
                      className={`rounded-full px-4 py-2 text-xs font-bold ${
                        themePref === "default"
                          ? "bg-[var(--theme-primary)]"
                          : "border border-[var(--theme-border-strong)]"
                      }`}
                    >
                      Default palette only
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[var(--theme-text-muted)]">
                  Cover blur lives in{" "}
                  <Link href="/settings" className="font-bold text-[var(--theme-accent)] hover:underline">
                    Settings
                  </Link>
                  .
                </p>
              </div>
            </section>

            {message && <p className="text-xs font-bold text-emerald-400">{message}</p>}
            {error && <p className="text-xs font-bold text-red-400">{error}</p>}
          </div>
        ) : null}
      </div>
      <SiteFooterClient showFooterAds={false} />
    </div>
  );
}
