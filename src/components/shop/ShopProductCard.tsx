import Image from "next/image";

type Props = {
  title: string;
  price: string;
  garment: string;
  imageSrc?: string;
  imageAlt?: string;
  mockLabel?: string;
};

export function ShopProductCard({
  title,
  price,
  garment,
  imageSrc,
  imageAlt,
  mockLabel = "ITEM",
}: Props) {
  return (
    <article className="flex gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md bg-[var(--background)] sm:h-36 sm:w-36">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt ?? title}
            fill
            className="object-cover"
            sizes="144px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-bold text-[var(--theme-text-muted)]">
            {mockLabel}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
        <p className="mt-1 text-lg font-bold tabular-nums text-[var(--foreground)]">{price}</p>
        <p className="mt-1 text-xs text-[var(--theme-text-muted)]">{garment} · Unisex</p>
        <p className="mt-2 text-xs text-[var(--theme-text-muted)]">Shipping calculated at checkout</p>
      </div>
    </article>
  );
}
