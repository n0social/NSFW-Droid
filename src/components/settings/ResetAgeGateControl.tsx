"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { VESPER_WELCOME_STORAGE_KEY } from "@/lib/welcome-card";

export function ResetAgeGateControl() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reset() {
    if (
      !window.confirm(
        "Clear age verification and show the welcome card again on the store? You will need to confirm 18+ on the next visit.",
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/reset-age-gate", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        welcomeStorageKey?: string;
      };
      if (!res.ok || !data.ok) {
        setMessage("Could not reset — sign in and try again.");
        return;
      }
      try {
        localStorage.removeItem(data.welcomeStorageKey ?? VESPER_WELCOME_STORAGE_KEY);
      } catch {
        /* private mode */
      }
      setMessage("Reset. Opening the store…");
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-[var(--theme-border)]/40 pt-4">
      <p className="text-xs font-bold text-[var(--theme-text-muted)]">Testing &amp; onboarding</p>
      <p className="mt-1 text-sm text-[var(--theme-text-muted)]">
        Clears the <code className="text-[var(--theme-accent)]">age_verified</code> cookie and
        Vesper welcome dismissal (
        <code className="text-[var(--theme-accent)]">{VESPER_WELCOME_STORAGE_KEY}</code> in
        localStorage). Manual clear works too; this button is only available while signed in.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void reset()}
        className="mt-3 rounded-full border border-[var(--theme-border-strong)] px-4 py-2 text-xs font-bold hover:bg-[var(--theme-primary)]/15 disabled:opacity-50"
      >
        {busy ? "Resetting…" : "Reset age gate & welcome"}
      </button>
      {message && <p className="mt-2 text-xs font-bold text-emerald-400">{message}</p>}
    </div>
  );
}
