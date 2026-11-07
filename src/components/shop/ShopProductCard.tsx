import Image from "next/image";
import { HOODIE_SIZES } from "@/lib/shop/home-products";

type Props = {
  title: string;
  imageSrc?: string;
  imageAlt?: string;
};

export function ShopProductCard({ title, imageSrc, imageAlt }: Props) {
  return (
    <article className="min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-md bg-[var(--background)]">
        {imageSrc ? (
          <Image src={imageSrc} alt={imageAlt ?? title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 240px" />
        ) : null}
      </div>
      <h3 className="mt-2 text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-1 text-xs text-[var(--theme-text-muted)]">{HOODIE_SIZES.join("  ")}</p>
    </article>
  );
}
