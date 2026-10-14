"use client";

import type { Listing } from "@/db/schema";

type Props = {
  featured: Listing | null;
  blur: boolean;
};

export function HeroCarousel({ featured, blur }: Props) {
  const title = featured?.title ?? "Mature games catalog";
  const subtitle = featured
    ? "Featured pick from the catalog — open the store page after you confirm 18+."
    : "Discover adult titles on itch.io, Steam, and partner stores. Rankings from real traffic on this site.";

  const href = featured ? `/api/go/${featured.id}` : "#browse";

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-[#C026D3]/25 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
      <div
        className="relative aspect-[21/9] min-h-[140px] w-full sm:min-h-[200px]"
        style={{
          background:
            "linear-gradient(135deg, #2d1b4e 0%, #C026D3 40%, #FF4D8D 70%, #14061C 100%)",
        }}
      >
        <div
          className={`relative flex h-full min-h-[140px] flex-col justify-end p-6 sm:min-h-[200px] sm:p-10 ${blur && featured ? "blur-md" : ""}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#14061Cee] via-[#14061C66] to-transparent" />
          <div className="relative z-10 max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#F9A8D4]">
              {featured ? "Featured" : "Welcome"}
            </p>
            <h1 className="mt-1 text-xl font-black leading-tight text-[#FFF1F7] sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-xs font-medium text-[#E9D5FF]/90 sm:text-sm">{subtitle}</p>
            <a
              href={href}
              className="mt-4 inline-block rounded-full bg-[#FF4D8D] px-5 py-2.5 text-xs font-black text-[#FFF1F7] shadow-lg hover:bg-[#ff6aa3]"
            >
              {featured ? "View on store" : "Browse catalog"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
