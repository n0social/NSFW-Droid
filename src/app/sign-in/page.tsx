"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function SignInPage() {
  const router = useRouter();
  const { configured, loading, user, signInWithEmail, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/account");
  }, [loading, user, router]);

  async function onEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      await signInWithEmail(String(form.get("email")), String(form.get("password")));
      router.push("/account");
    } catch {
      setError("Could not sign in. Check email and password, or create the user in Firebase Console.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.push("/account");
    } catch {
      setError("Google sign-in failed. Confirm the provider is enabled in Firebase.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12">
        <Link href="/" className="text-xs font-bold text-[var(--theme-accent)]">← Store</Link>
        <h1 className="mt-4 text-2xl font-black">Sign in</h1>

        {!configured ? (
          <div className="mt-6 rounded-2xl border-2 border-[var(--theme-primary)]/40 bg-[var(--theme-surface)] p-6 text-sm leading-relaxed text-[var(--theme-text-muted)]">
            <p className="font-bold text-[var(--foreground)]">Firebase not configured</p>
            <p className="mt-2">
              Add your Firebase web app keys to the environment (see{" "}
              <code className="text-[10px]">.env.example</code> and{" "}
              <span className="text-[var(--theme-accent)]">docs/firebase-setup.md</span>
              ). Rebuild after setting <code className="text-[10px]">/etc/nsfwdroid.env</code> on the
              droplet.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-xs text-[var(--theme-text-muted)]">
              Email/password and Google use Firebase Authentication on this device.
            </p>
            <form onSubmit={onEmailSubmit} className="mt-6 space-y-3">
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email"
                className="w-full rounded-xl border-2 border-[var(--theme-primary)]/40 bg-[var(--background)] px-3 py-2 text-sm"
              />
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Password"
                className="w-full rounded-xl border-2 border-[var(--theme-primary)]/40 bg-[var(--background)] px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-[var(--theme-primary)] py-2.5 text-sm font-black disabled:opacity-50"
              >
                Sign in with email
              </button>
            </form>
            <button
              type="button"
              disabled={busy}
              onClick={onGoogle}
              className="mt-3 w-full rounded-xl border-2 border-[var(--theme-primary)]/50 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              Continue with Google
            </button>
            {error && <p className="mt-3 text-xs font-bold text-red-400">{error}</p>}
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
