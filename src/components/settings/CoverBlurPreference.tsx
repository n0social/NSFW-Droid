"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  ageVerified: boolean;
  blurCovers: boolean;
};

export function CoverBlurPreference({ ageVerified, blurCovers: initialBlur }: Props) {
  const router = useRouter();
  const [blurCovers, setBlurCovers] = useState(initialBlur);
  const [busy, setBusy] = useState(false);

  async function onChange(enabled: boolean) {
    if (!ageVerified || busy) return;
    setBlurCovers(enabled);
    setBusy(true);
    try {
      const res = await fetch("/api/blur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        setBlurCovers(initialBlur);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={blurCovers}
          disabled={!ageVerified || busy}
          onChange={(e) => void onChange(e.target.checked)}
        />
        <span>
          Blur game covers by default
          {!ageVerified && (
            <span className="mt-1 block text-xs font-medium text-[var(--theme-text-muted)]">
              Confirm you are 18+ before changing this preference. Covers stay blurred until then.
            </span>
          )}
          {ageVerified && (
            <span className="mt-1 block text-xs font-medium text-[var(--theme-text-muted)]">
              When off, cover art shows clearly across the catalog after age verification.
            </span>
          )}
        </span>
      </label>
    </div>
  );
}
