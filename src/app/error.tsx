"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 text-center text-[var(--foreground)]">
      <h1 className="text-lg font-black">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-[var(--theme-text-muted)]">
        The page could not load. Navigation, legal pages, and static content may still work.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-[#FF4D8D] px-5 py-2 text-xs font-bold text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-[var(--theme-primary)] px-5 py-2 text-xs font-bold"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
