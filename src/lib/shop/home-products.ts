import { SHOP_ASSETS } from "@/lib/shop/assets";

export type ShopHomeVariant = "design" | "production";

export const SHOP_CHIPS = ["Tees", "Hoodies"] as const;
export type ShopChip = (typeof SHOP_CHIPS)[number];

export const HOODIE_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;

export type ShopGarment = "Tee" | "Hoodie";

export type ShopHomeProduct = {
  title: string;
  garment: ShopGarment;
  imageSrc: string;
  imageAlt: string;
};

const PRINTS = [
  {
    imageSrc: SHOP_ASSETS.pandaHoodieV2,
    imageAlt: "Vesper in a panda hoodie",
  },
  {
    imageSrc: SHOP_ASSETS.occultEngravedPyramid,
    imageAlt: "Engraved gold pyramid print",
  },
  {
    imageSrc: SHOP_ASSETS.occultWhiteTriangle,
    imageAlt: "White triangle print",
  },
  {
    imageSrc: SHOP_ASSETS.occultOrangeStripes,
    imageAlt: "Gold pyramid print on orange stripes",
  },
] as const;

/** Same four prints, split by garment so a tee and a hoodie are never on screen together. */
export const SHOP_HOME_PRODUCTS: ShopHomeProduct[] = PRINTS.flatMap((print) => [
  { title: "Tee", garment: "Tee" as const, ...print },
  { title: "Hoodie", garment: "Hoodie" as const, ...print },
]);
