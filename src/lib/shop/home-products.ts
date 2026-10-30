import { SHOP_ASSETS } from "@/lib/shop/assets";

export type ShopHomeVariant = "design" | "production";

export const SHOP_CHIPS = ["All", "Merch", "Digital", "Bundles"] as const;
export type ShopChip = (typeof SHOP_CHIPS)[number];

export type ShopHomeProduct = {
  title: string;
  price: string;
  pill: string;
  chip: ShopChip;
  imageSrc?: string;
  imageAlt?: string;
  mockLabel?: string;
};

export const SHOP_HOME_PRODUCTS: ShopHomeProduct[] = [
  {
    title: "Vesper sticker pack v1",
    price: "$12.00 USD",
    pill: "Ships worldwide",
    chip: "Merch",
    mockLabel: "STK",
    imageSrc: SHOP_ASSETS.andriStickerSheet,
    imageAlt: "Andri sticker sheet variants",
  },
  {
    title: "NSFW Droid wordmark tee",
    price: "$28.00 USD",
    pill: "Merch",
    chip: "Merch",
    mockLabel: "TEE",
    imageSrc: SHOP_ASSETS.pandaHoodieV2,
    imageAlt: "Vesper in panda hoodie pin-up art",
  },
  {
    title: "Vesper + Andri peace sticker",
    price: "$9.00 USD",
    pill: "Sticker",
    chip: "Merch",
    mockLabel: "DUO",
    imageSrc: SHOP_ASSETS.peaceDuoV2,
    imageAlt: "Vesper and Andri peace sign duo sticker art",
  },
  {
    title: "Vesper 4K wallpaper pack",
    price: "$8.00 USD",
    pill: "Instant download",
    chip: "Digital",
    mockLabel: "ZIP",
  },
];

export const SHOP_FEATURED_DEAL = {
  title: "Supporter bundle",
  description: "Sticker pack + wallpaper ZIP — launch bundle placeholder.",
  price: "$17.00 USD",
  imageSrc: SHOP_ASSETS.chibiDealBannerV2,
  imageAlt: "DEAL marketing chibi banner",
} as const;
