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
      className="border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/90 px-3 py-2.5 text-center text-[10px] font-semibold text-[var(--theme-text-muted)] sm:px-4 sm:text-[11px]"
      role="region"
      aria-label="Holiday theme"
    >
      {showHolidayBanner && (
        <span className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap">
          {activeThemeId !== "default" && (
            <Image
              src={`/api/theme/icon/${activeThemeId}`}
              alt=""
              className="h-5 w-5 shrink-0"
              width={20}
              height={20}
              unoptimized
            />
          )}
          <span className="min-w-0 text-balance">{activeThemeName} theme is on</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => setPreference("default")}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-[var(--theme-border-strong)] px-3 py-2 text-[10px] font-bold text-[var(--foreground)] hover:bg-[var(--theme-primary)]/20 disabled:opacity-50 sm:min-h-0 sm:py-1"
          >
            Remove holiday theme
          </button>
        </span>
      )}
      {showRestore && (
        <span className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap">
          <span className="min-w-0 text-balance">Using default colors</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => setPreference("auto")}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-[var(--theme-border-strong)] px-3 py-2 text-[10px] font-bold text-[var(--foreground)] hover:bg-[var(--theme-primary)]/20 disabled:opacity-50 sm:min-h-0 sm:py-1"
          >
            Use holiday theme
          </button>
        </span>
      )}
    </div>
  );
}
