"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type Props = {
  /** Called after navigation (e.g. close mobile drawer). */
  onNavigate?: () => void;
  /** Compact styles for mobile drawer vs desktop bar. */
  variant: "desktop" | "mobile";
};

const ITEMS = [
  { href: "/creators", label: "Studios & games", hint: "Publishers and spotlight titles" },
  { href: "/creators/assets", label: "Creator assets", hint: "Sounds, SFM tutorials & tools" },
  { href: "/creators/tutorials", label: "SFM tutorials", hint: "NSFW Source Filmmaker learning links" },
  { href: "/creators/models", label: "SFM models", hint: "Top NSFW models → SmutBase" },
  { href: "/links", label: "Community links", hint: "Catalogs, forums, hentai & SFM hubs" },
] as const;

export function CreatorsNavMenu({ onNavigate, variant }: Props) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  if (variant === "mobile") {
    return (
      <li>
        <p className="px-3 pt-2 text-[10px] font-bold uppercase tracking-wide text-[var(--theme-text-muted)]/70">
          Creators
        </p>
        <ul className="mt-1 flex flex-col gap-0.5">
          {ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={close}
                className="flex min-h-[44px] flex-col justify-center rounded-xl px-3 py-2 hover:bg-[var(--theme-surface)]"
              >
                <span className="text-sm font-bold text-[var(--foreground)]">{item.label}</span>
                <span className="text-[10px] font-semibold text-[var(--theme-text-muted)]">
                  {item.hint}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </li>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-bold text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)]"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        Creators
        <span className="text-[9px] opacity-70" aria-hidden>▾</span>
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-full z-[60] mt-1 min-w-[15rem] rounded-xl border border-[var(--theme-primary)]/35 bg-[var(--background)] py-1 shadow-xl"
        >
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className="block px-4 py-2.5 hover:bg-[var(--theme-surface)]"
              onClick={() => setOpen(false)}
            >
              <span className="block text-[11px] font-bold text-[var(--foreground)]">
                {item.label}
              </span>
              <span className="block text-[10px] font-semibold text-[var(--theme-text-muted)]">
                {item.hint}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
