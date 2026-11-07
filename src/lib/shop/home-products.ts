import { SHOP_ASSETS } from "@/lib/shop/assets";

export type ShopHomeVariant = "design" | "production";

export const SHOP_CHIPS = ["All", "Tees", "Hoodies"] as const;
export type ShopChip = (typeof SHOP_CHIPS)[number];

export const HOODIE_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;

export type ShopHomeProduct = {
  title: string;
  imageSrc: string;
  imageAlt: string;
};

/** Hoodies only. One card per print. */
export const SHOP_HOME_PRODUCTS: ShopHomeProduct[] = [
  {
    title: "Vesper panda hoodie",
    imageSrc: SHOP_ASSETS.pandaHoodieV2,
    imageAlt: "Vesper in a panda hoodie",
  },
  {
    title: "Engraved pyramid hoodie",
    imageSrc: SHOP_ASSETS.occultEngravedPyramid,
    imageAlt: "Engraved gold pyramid print",
  },
  {
    title: "White triangle hoodie",
    imageSrc: SHOP_ASSETS.occultWhiteTriangle,
    imageAlt: "White triangle print",
  },
  {
    title: "Orange stripe hoodie",
    imageSrc: SHOP_ASSETS.occultOrangeStripes,
    imageAlt: "Gold pyramid print on orange stripes",
  },
];
