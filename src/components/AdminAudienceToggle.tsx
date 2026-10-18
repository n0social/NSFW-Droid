"use client";

import type { AnalyticsAudience } from "@/lib/analytics-quality";

type Props = {
  value: AnalyticsAudience;
  onChange: (next: AnalyticsAudience) => void;
};

export function AdminAudienceToggle({ value, onChange }: Props) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      <span className="font-bold text-[#E9D5FF]/80">Metrics view:</span>
      <button
        type="button"
        onClick={() => onChange("visitors")}
        className={`rounded-full border px-3 py-1 font-semibold ${
          value === "visitors"
            ? "border-[#FF4D8D] bg-[#FF4D8D]/20 text-[#FFF1F7]"
            : "border-[#C026D3]/35 text-[#E9D5FF]/70 hover:border-[#C026D3]/60"
        }`}
      >
        Visitors only
      </button>
      <button
        type="button"
        onClick={() => onChange("all")}
        className={`rounded-full border px-3 py-1 font-semibold ${
          value === "all"
            ? "border-[#FF4D8D] bg-[#FF4D8D]/20 text-[#FFF1F7]"
            : "border-[#C026D3]/35 text-[#E9D5FF]/70 hover:border-[#C026D3]/60"
        }`}
      >
        All events
      </button>
      <span className="text-[10px] text-[#E9D5FF]/55">
        Visitors = age-verified play clicks from public pages (excludes bots, admin QA,{" "}
        <code className="text-[#F9A8D4]">X-NSFWDroid-Internal</code>). All = raw{" "}
        <code className="text-[#F9A8D4]">/api/go</code> rows including crawler noise.
      </span>
    </div>
  );
}
