import Image from "next/image";

type Props = {
  title: string;
  price: string;
  pill: string;
  imageSrc?: string;
  imageAlt?: string;
  mockLabel?: string;
};

export function ShopProductCard({
  title,
  price,
  pill,
  imageSrc,
  imageAlt,
  mockLabel = "SKU",
}: Props) {
  return (
    <article className="flex flex-col gap-2 rounded-2xl border-2 border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 transition-transform hover:scale-[1.02] hover:border-[var(--theme-accent)]/60">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--background)]">
        <span className="absolute left-2 top-2 z-[1] rounded-full border border-[var(--theme-primary)]/40 bg-[var(--theme-surface)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--theme-text-muted)]">
          {pill}
        </span>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt ?? title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-bold text-[var(--theme-text-muted)]">
            {mockLabel}
          </div>
        )}
      </div>
      <h3 className="line-clamp-2 text-sm font-bold text-[var(--foreground)]">{title}</h3>
      <p className="text-sm font-bold tabular-nums text-[var(--theme-primary)]">{price}</p>
    </article>
  );
}
