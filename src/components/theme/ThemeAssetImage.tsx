"use client";

type Props = {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Decorative holiday SVG from /api/theme/asset (unoptimized). */
export function ThemeAssetImage({ src, alt, className, style }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
    />
  );
}
