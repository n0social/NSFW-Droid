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
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-[#14061C]/95 p-3 backdrop-blur-md sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Backdrop: not dismissible — clicks do nothing */}
      <div className="absolute inset-0" aria-hidden />

      <div
        className="relative z-10 my-auto w-full max-w-sm max-h-[min(90dvh,640px)] overflow-y-auto rounded-2xl border-2 border-[#C026D3] bg-[#241033] p-5 text-center shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-3xl" aria-hidden>♥</p>
        <h2 id="age-gate-title" className="mt-3 text-lg font-black text-[#FFF1F7] sm:text-xl">
          Are you over 18?
        </h2>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-[#E9D5FF]">
          You must be 18 or older to browse this catalog.
        </p>
        <p className="mt-3 text-[10px] font-semibold text-[#E9D5FF]/70">
          <a href="/terms" className="underline hover:text-[#FF4D8D]">Terms</a>
          {" · "}
          <a href="/privacy" className="underline hover:text-[#FF4D8D]">Privacy</a>
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => answer("yes")}
            className="min-h-[48px] w-full rounded-full bg-[#C026D3] px-8 py-3 text-sm font-black text-[#FFF1F7] disabled:opacity-60 sm:w-auto"
          >
            Yes
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => answer("no")}
            className="min-h-[48px] w-full rounded-full border-2 border-[#FF4D8D] px-8 py-3 text-sm font-black text-[#FFF1F7] disabled:opacity-60 sm:w-auto"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
