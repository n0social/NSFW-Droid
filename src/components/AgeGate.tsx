"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
};

export function AgeGate({ open }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!open) return null;

  async function answer(value: "yes" | "no") {
    setLoading(true);
    try {
      const res = await fetch("/api/age-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: value }),
      });
      const data = await res.json();
      if (data.redirect) {
        router.push(data.redirect);
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14061C]/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Backdrop: not dismissible — clicks do nothing */}
      <div className="absolute inset-0" aria-hidden />

      <div
        className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border-2 border-[#C026D3] bg-[#241033] p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-3xl" aria-hidden>♥</p>
        <h2 id="age-gate-title" className="mt-3 text-xl font-black text-[#FFF1F7]">
          Are you over 18?
        </h2>
        <p className="mt-2 text-xs font-semibold text-[#E9D5FF]">
          You must be 18 or older to browse this catalog. Production will add verified age checks.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => answer("yes")}
            className="rounded-full bg-[#C026D3] px-8 py-3 text-sm font-black text-[#FFF1F7] disabled:opacity-60"
          >
            Yes
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => answer("no")}
            className="rounded-full border-2 border-[#FF4D8D] px-8 py-3 text-sm font-black text-[#FFF1F7] disabled:opacity-60"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
