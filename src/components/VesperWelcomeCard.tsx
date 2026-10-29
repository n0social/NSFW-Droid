"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type CSSProperties } from "react";

import { VESPER_WELCOME_STORAGE_KEY } from "@/lib/welcome-card";

const STORAGE_KEY = VESPER_WELCOME_STORAGE_KEY;

const CONFETTI_PIECES: {
  left: string;
  top: string;
  color: string;
  delay: string;
  dur: string;
  w: number;
  h: number;
}[] = [
  { left: "4%", top: "8%", color: "#FF4D8D", delay: "0s", dur: "3.1s", w: 7, h: 11 },
  { left: "12%", top: "18%", color: "#C026D3", delay: "0.4s", dur: "3.6s", w: 6, h: 9 },
  { left: "22%", top: "5%", color: "#E9D5FF", delay: "0.2s", dur: "2.9s", w: 8, h: 6 },
  { left: "31%", top: "14%", color: "#FF4D8D", delay: "0.9s", dur: "3.4s", w: 5, h: 10 },
  { left: "40%", top: "6%", color: "#F472B6", delay: "0.1s", dur: "3.8s", w: 7, h: 7 },
  { left: "48%", top: "20%", color: "#C026D3", delay: "0.6s", dur: "3.2s", w: 6, h: 12 },
  { left: "55%", top: "9%", color: "#FFF1F7", delay: "0.3s", dur: "2.7s", w: 5, h: 8 },
  { left: "63%", top: "16%", color: "#FF4D8D", delay: "1.1s", dur: "3.5s", w: 8, h: 5 },
  { left: "71%", top: "4%", color: "#A855F7", delay: "0.5s", dur: "3.9s", w: 6, h: 10 },
  { left: "78%", top: "22%", color: "#C026D3", delay: "0.7s", dur: "3s", w: 7, h: 7 },
  { left: "86%", top: "10%", color: "#FF4D8D", delay: "0.15s", dur: "3.3s", w: 5, h: 9 },
  { left: "92%", top: "19%", color: "#E9D5FF", delay: "0.85s", dur: "2.8s", w: 6, h: 6 },
  { left: "8%", top: "42%", color: "#C026D3", delay: "1.2s", dur: "3.7s", w: 7, h: 8 },
  { left: "18%", top: "55%", color: "#FF4D8D", delay: "0.25s", dur: "3.1s", w: 5, h: 11 },
  { left: "28%", top: "48%", color: "#F472B6", delay: "0.95s", dur: "2.6s", w: 8, h: 6 },
  { left: "36%", top: "62%", color: "#FFF1F7", delay: "0.55s", dur: "3.4s", w: 6, h: 9 },
  { left: "44%", top: "52%", color: "#A855F7", delay: "1.05s", dur: "3s", w: 7, h: 7 },
  { left: "52%", top: "44%", color: "#FF4D8D", delay: "0.35s", dur: "3.6s", w: 5, h: 10 },
  { left: "60%", top: "58%", color: "#C026D3", delay: "0.75s", dur: "2.9s", w: 8, h: 5 },
  { left: "68%", top: "50%", color: "#E9D5FF", delay: "1.15s", dur: "3.2s", w: 6, h: 11 },
  { left: "76%", top: "64%", color: "#FF4D8D", delay: "0.45s", dur: "3.8s", w: 7, h: 8 },
  { left: "84%", top: "46%", color: "#C026D3", delay: "0.65s", dur: "3.1s", w: 5, h: 9 },
  { left: "94%", top: "56%", color: "#F472B6", delay: "0.05s", dur: "2.7s", w: 6, h: 7 },
  { left: "6%", top: "72%", color: "#FF4D8D", delay: "0.8s", dur: "3.5s", w: 8, h: 6 },
  { left: "16%", top: "78%", color: "#C026D3", delay: "0.2s", dur: "3.3s", w: 6, h: 10 },
  { left: "26%", top: "70%", color: "#E9D5FF", delay: "1s", dur: "2.8s", w: 7, h: 7 },
  { left: "38%", top: "82%", color: "#A855F7", delay: "0.5s", dur: "3.6s", w: 5, h: 9 },
  { left: "50%", top: "74%", color: "#FF4D8D", delay: "0.3s", dur: "3.2s", w: 8, h: 5 },
  { left: "62%", top: "80%", color: "#C026D3", delay: "0.9s", dur: "2.9s", w: 6, h: 11 },
  { left: "74%", top: "72%", color: "#FFF1F7", delay: "0.6s", dur: "3.4s", w: 7, h: 8 },
  { left: "86%", top: "84%", color: "#FF4D8D", delay: "0.1s", dur: "3.7s", w: 5, h: 10 },
  { left: "96%", top: "68%", color: "#F472B6", delay: "1.1s", dur: "3s", w: 6, h: 6 },
];

type Props = {
  ageVerified: boolean;
};

function WelcomeConfetti() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
      aria-hidden
    >
      {CONFETTI_PIECES.map((p, i) => (
        <span
          key={i}
          className="vesper-welcome-confetti absolute rounded-[2px] shadow-sm"
          style={
            {
              left: p.left,
              top: p.top,
              width: p.w,
              height: p.h,
              backgroundColor: p.color,
              "--confetti-delay": p.delay,
              "--confetti-dur": p.dur,
            } as CSSProperties
          }
        />
      ))}
      <span
        className="vesper-welcome-confetti absolute left-[2%] top-[28%] text-2xl opacity-90 sm:text-3xl"
        style={{ "--confetti-delay": "0.2s", "--confetti-dur": "4s" } as CSSProperties}
      >
        ✨
      </span>
      <span
        className="vesper-welcome-confetti absolute right-[4%] top-[32%] text-xl opacity-85 sm:text-2xl"
        style={{ "--confetti-delay": "0.55s", "--confetti-dur": "3.6s" } as CSSProperties}
      >
        🎊
      </span>
    </div>
  );
}

export function VesperWelcomeCard({ ageVerified }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ageVerified) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      return;
    }
    setOpen(true);
  }, [ageVerified]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-[#14061C]/85 p-3 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vesper-welcome-title"
    >
      <WelcomeConfetti />

      <div
        className="relative z-10 my-auto flex w-full max-w-[min(100%,40rem)] flex-col items-center sm:max-w-4xl sm:flex-row sm:items-end sm:justify-center sm:gap-0"
        onClick={(e) => e.stopPropagation()}
      >
        <article
          className="relative w-full overflow-visible sm:max-w-md sm:shrink-0"
        >
          <span
            className="vesper-welcome-megaphone pointer-events-none absolute -left-1 -top-3 z-20 text-3xl drop-shadow-[0_4px_12px_rgba(192,38,211,0.55)] sm:-left-4 sm:-top-5 sm:text-4xl"
            aria-hidden
          >
            📣
          </span>
          <span
            className="vesper-welcome-megaphone pointer-events-none absolute -right-2 top-8 z-20 text-2xl opacity-90 sm:-right-6 sm:top-6 sm:text-3xl"
            style={{ animationDelay: "0.6s" }}
            aria-hidden
          >
            🥳
          </span>

          <div
            className="relative overflow-hidden rounded-2xl border-2 border-[#FF4D8D]/80 bg-[#241033] p-[2px] shadow-[0_0_0_1px_rgba(192,38,211,0.35),0_24px_60px_rgba(20,6,28,0.75),0_0_48px_rgba(192,38,211,0.25)]"
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-[14px] bg-[linear-gradient(135deg,rgba(255,77,141,0.22)_0%,transparent_40%,rgba(192,38,211,0.18)_70%,rgba(45,27,78,0.5)_100%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#C026D3]/20 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-[#FF4D8D]/15 blur-2xl"
              aria-hidden
            />

            <div className="relative rounded-[14px] bg-[linear-gradient(160deg,#2d1b4e_0%,#241033_45%,#1a0a28_100%)] px-5 py-6 text-left sm:px-7 sm:py-8">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full border border-[#FF4D8D]/60 bg-[#FF4D8D]/15 px-2.5 py-0.5 text-[10px] font-black tracking-wide text-[#FFF1F7]"
                >
                  18+
                </span>
                <span
                  className="inline-flex items-center rounded-full border border-[#C026D3]/50 bg-[#C026D3]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#E9D5FF]"
                >
                  Adults only
                </span>
                <span
                  className="inline-flex items-center rounded-full border border-[#E9D5FF]/25 bg-[#14061C]/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#FF4D8D]"
                >
                  Curated catalog
                </span>
              </div>

              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF4D8D]">
                Welcome aboard
              </p>
              <h2
                id="vesper-welcome-title"
                className="mt-2 bg-[linear-gradient(90deg,#FFF1F7_0%,#F9A8D4_45%,#E9D5FF_100%)] bg-clip-text text-2xl font-black leading-[1.15] text-transparent sm:text-[1.65rem]"
              >
                You&apos;re in — welcome to NSFW Droid
              </h2>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-[#E9D5FF]">
                Browse hand-picked adult games, chase spicy deals, and heart your favorites.
                Vesper&apos;s cheering you on from the sidelines — go explore.
              </p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-[#E9D5FF]/65">
                Cover art is clear by default — turn on blur anytime in Settings if you want it.
              </p>

              <button
                type="button"
                onClick={dismiss}
                className="mt-6 min-h-[48px] w-full rounded-full border border-[#FF4D8D]/40 bg-[linear-gradient(90deg,#C026D3_0%,#FF4D8D_100%)] px-8 py-3 text-sm font-black text-[#FFF1F7] shadow-[0_8px_24px_rgba(192,38,211,0.45)] transition-transform active:scale-[0.98] sm:w-auto sm:px-10"
              >
                Let&apos;s party — start browsing
              </button>
            </div>
          </div>
        </article>

        <figure
          className="relative z-20 -mt-10 w-[min(78vw,300px)] shrink-0 sm:-ml-6 sm:mt-0 sm:w-[min(42vw,340px)] lg:w-[360px]"
          aria-hidden
        >
          <div
            className="pointer-events-none absolute inset-x-4 bottom-2 h-16 rounded-full bg-[#C026D3]/25 blur-2xl"
            aria-hidden
          />
          <Image
            src="/mascot/vesper/vesper-heart-bend-cutout.png"
            alt=""
            width={720}
            height={960}
            className="pointer-events-none relative mx-auto w-full max-w-none object-contain object-bottom drop-shadow-[0_12px_40px_rgba(192,38,211,0.35)] sm:translate-y-2"
            sizes="(max-width: 640px) 300px, 360px"
            priority
          />
        </figure>
      </div>
    </div>
  );
}
