"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ThemeClientState = {
  activeThemeId: string;
  activeThemeName: string;
  scheduledThemeId: string;
  isSignedIn: boolean;
};

type Props = ThemeClientState;

/**
 * Holiday opt-out UI is shown only when isSignedIn is true (Firebase session cookie on the server).
 * Server-side theme_override cookie still works for all visitors via POST /api/theme/override.
 */
export function ThemeProvider({
  activeThemeId,
  activeThemeName,
  scheduledThemeId,
  isSignedIn,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const showHolidayBanner =
    isSignedIn && activeThemeId !== "default" && scheduledThemeId !== "default";

  const showRestore =
    isSignedIn &&
    activeThemeId === "default" &&
    scheduledThemeId !== "default";

  if (!showHolidayBanner && !showRestore) return null;

  async function setPreference(preference: "default" | "auto") {
    setBusy(true);
    try {
      await fetch("/api/theme/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preference }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/90 px-4 py-2 text-center text-[11px] font-semibold text-[var(--theme-text-muted)]"
      role="region"
      aria-label="Holiday theme"
    >
      {showHolidayBanner && (
        <span className="inline-flex flex-wrap items-center justify-center gap-2">
          {activeThemeId !== "default" && (
            <Image
              src={`/api/theme/icon/${activeThemeId}`}
              alt=""
              className="h-5 w-5"
              width={20}
              height={20}
              unoptimized
            />
          )}
          <span>{activeThemeName} theme is on</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => setPreference("default")}
            className="rounded-full border border-[var(--theme-border-strong)] px-3 py-1 text-[10px] font-bold text-[var(--foreground)] hover:bg-[var(--theme-primary)]/20 disabled:opacity-50"
          >
            Remove holiday theme
          </button>
        </span>
      )}
      {showRestore && (
        <span className="inline-flex flex-wrap items-center justify-center gap-2">
          <span>Using default colors</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => setPreference("auto")}
            className="rounded-full border border-[var(--theme-border-strong)] px-3 py-1 text-[10px] font-bold text-[var(--foreground)] hover:bg-[var(--theme-primary)]/20 disabled:opacity-50"
          >
            Use holiday theme
          </button>
        </span>
      )}
    </div>
  );
}
