"use client";

import { useState } from "react";
import { OutboundPopunderLink } from "@/components/OutboundPopunderLink";
import type { CuratedSfmModel } from "@/lib/sfm-models-curated";
import { smutbaseHref } from "@/lib/sfm-models-curated";

type Props = {
  model: CuratedSfmModel;
  blur: boolean;
  ageVerified: boolean;
};

export function SfmModelCard({ model, blur, ageVerified }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const href = smutbaseHref(model);
  const src = model.previewImageSrc?.trim();
  const showImage = Boolean(src) && !imageFailed;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--theme-primary)]/30 bg-[var(--theme-surface)]/80 shadow-[0_10px_28px_rgba(0,0,0,0.4)]">
      <OutboundPopunderLink
        href={href}
        ageVerified={ageVerified}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden"
        aria-label={`${model.characterName} on SmutBase (opens in new tab)`}
      >
        {showImage ? (
          <img
            src={src}
            alt={`${model.characterName} — ${model.sourceGame} (SFW preview)`}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-[filter] duration-300 ${blur ? "blur-xl scale-105" : ""}`}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-b from-[#4a1d6a] via-[#2d1b4e] to-[#14061C] transition-[filter] duration-300 ${blur ? "blur-xl scale-105" : ""}`}
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14061C] via-[#14061C]/40 to-transparent" />
        {blur && (
          <span className="absolute inset-0 z-[2] flex items-center justify-center bg-[#14061C]/50 text-[10px] font-bold uppercase tracking-wide text-[#F9A8D4]">
            Blurred in settings
          </span>
        )}
        <div className="relative z-[1] px-3 pb-3 pt-16">
          <p className="text-[10px] font-semibold text-[#E9D5FF]/70">{model.sourceGame}</p>
          <h3 className="text-base font-black leading-tight text-[#FFF1F7] group-hover:text-[#FF4D8D]">
            {model.characterName}
          </h3>
        </div>
      </OutboundPopunderLink>
      <p className="px-3 py-2 text-[10px] leading-snug text-[#E9D5FF]/65">{model.pickNote}</p>
      <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-wide text-[#FF4D8D]">
        SmutBase →
      </p>
    </article>
  );
}
