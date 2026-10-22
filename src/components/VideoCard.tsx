"use client";

import { OutboundPopunderLink } from "@/components/OutboundPopunderLink";
import type { VideoFeedItem } from "@/lib/video-feeds";

const gradients = [
  "linear-gradient(145deg, #4a1d6a 0%, #C026D3 45%, #14061C 100%)",
  "linear-gradient(145deg, #2d1b4e 0%, #FF4D8D 50%, #241033 100%)",
  "linear-gradient(160deg, #1a3a4a 0%, #7c3aed 40%, #14061C 100%)",
];

type Props = {
  video: VideoFeedItem;
  index: number;
  blur: boolean;
  ageVerified: boolean;
  layout?: "rail" | "grid";
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayDiff = Math.round((startOfToday.getTime() - startOfThat.getTime()) / 86_400_000);
    if (dayDiff === 0) return "Today";
    if (dayDiff === 1) return "Yesterday";
    if (dayDiff > 1 && dayDiff < 7) return `${dayDiff} days ago`;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
    });
  } catch {
    return "";
  }
}

export function VideoCard({ video, index, blur, ageVerified, layout = "grid" }: Props) {
  const w = layout === "rail" ? "w-[min(42vw,168px)] md:w-[160px] shrink-0 snap-start" : "w-full";
  const h =
    layout === "rail" ? "h-[min(50vw,180px)] md:h-[160px]" : "aspect-video w-full";
  const thumb = video.thumbnailUrl?.trim() || null;
  const gradient = gradients[index % gradients.length];

  const dateLabel = formatDate(video.publishedAt);

  return (
    <article
      className={`${w} overflow-hidden rounded-2xl bg-[#241033] shadow-[0_10px_28px_rgba(0,0,0,0.45)]`}
    >
      <OutboundPopunderLink
        href={video.link}
        ageVerified={ageVerified}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
        aria-label={`Watch on ${video.sourceLabel}: ${video.title}`}
      >
        <div
          className={`relative ${h}`}
          style={{ background: thumb ? undefined : gradient }}
        >
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 ${blur ? "blur-xl scale-105" : ""}`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 z-[1] flex items-end p-3">
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#14061Cee] via-transparent to-transparent"
              aria-hidden
            />
            <span className="relative z-10 text-xs font-extrabold leading-tight text-[#FFF1F7] line-clamp-3 drop-shadow-md">
              {video.title}
            </span>
          </div>
          {blur && (
            <span className="absolute right-2 top-2 z-20 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold text-[#F9A8D4]">
              Blurred
            </span>
          )}
          <span className="absolute left-2 top-2 z-20 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-bold text-[#E9D5FF]">
            External
          </span>
        </div>
        <div className="px-2.5 py-2 text-[10px] font-bold text-[#E9D5FF]">
          <span className="block truncate">{video.sourceLabel}</span>
          {dateLabel && (
            <span className="mt-0.5 block truncate text-[9px] font-semibold text-[#E9D5FF]/55">
              {dateLabel}
            </span>
          )}
        </div>
      </OutboundPopunderLink>
    </article>
  );
}
