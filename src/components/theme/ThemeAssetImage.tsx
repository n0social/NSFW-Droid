"use client";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Decorative holiday SVG from /api/theme/asset (unoptimized). */
export function ThemeAssetImage({ src, alt, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />
  );
}
