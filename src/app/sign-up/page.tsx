"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteFooterClient } from "@/components/site/SiteFooterClient";

export default function SignUpPage() {
  const router = useRouter();
  const { configured, loading, user, signUpWithEmail, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/account");
  }, [loading, user, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setBusy(false);
      return;
    }
    try {
      await signUpWithEmail(String(form.get("email")), password);
      router.push("/account");
    } catch {
      setError("Could not create account. Email may already be in use.");
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
      setError("Google sign-in failed. Try again or use email and password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-md flex-col justify-center px-4 py-8 sm:min-h-[calc(100vh-8rem)] sm:py-12">
        <Link href="/" className="text-xs font-bold text-[var(--theme-accent)]">← Store</Link>
        <h1 className="mt-4 text-2xl font-black">Create account</h1>

        {!configured ? (
          <div className="mt-6 rounded-2xl border-2 border-[var(--theme-primary)]/40 bg-[var(--theme-surface)] p-6 text-sm leading-relaxed text-[var(--theme-text-muted)]">
            <p className="font-bold text-[var(--foreground)]">Sign-up unavailable</p>
            <p className="mt-2">
              Accounts are not enabled on this deployment yet. You can still browse the catalog
              without signing in.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-xs text-[var(--theme-text-muted)]">
              Email sign-up or continue with Google. Already have an account?{" "}
              <Link href="/sign-in" className="font-bold text-[var(--theme-accent)]">Sign in</Link>
            </p>
            <form onSubmit={onSubmit} className="mt-6 space-y-3">
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
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Password (6+ characters)"
                className="w-full rounded-xl border-2 border-[var(--theme-primary)]/40 bg-[var(--background)] px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={busy}
                className="min-h-[48px] w-full rounded-xl bg-[var(--theme-primary)] py-2.5 text-sm font-black disabled:opacity-50"
              >
                Create account
              </button>
            </form>
            <button
              type="button"
              disabled={busy}
              onClick={onGoogle}
              className="mt-3 min-h-[48px] w-full rounded-xl border-2 border-[var(--theme-primary)]/50 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              Continue with Google
            </button>
            {error && <p className="mt-3 text-xs font-bold text-red-400">{error}</p>}
          </>
        )}
      </div>
      <SiteFooterClient showFooterAds={false} />
    </div>
  );
}
