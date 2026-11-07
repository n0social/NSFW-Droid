import { SHOP_ASSETS } from "@/lib/shop/assets";

export type ShopHomeVariant = "design" | "production";

export const SHOP_CHIPS = ["All", "Tees", "Hoodies"] as const;
export type ShopChip = (typeof SHOP_CHIPS)[number];

export type ShopGarment = "Tee" | "Hoodie";

export type ShopHomeProduct = {
  title: string;
  price: string;
  garment: ShopGarment;
  imageSrc: string;
  imageAlt: string;
};

/** Layout stand-ins, not final retail. Tee $18, hoodie $28. */
const TEE = "$18.00";
const HOODIE = "$28.00";

export const SHOP_HOME_PRODUCTS: ShopHomeProduct[] = [
  {
    title: "Vesper panda hoodie",
    price: HOODIE,
    garment: "Hoodie",
    imageSrc: SHOP_ASSETS.pandaHoodieV2,
    imageAlt: "Vesper in a panda hoodie",
  },
  {
    title: "Engraved pyramid tee",
    price: TEE,
    garment: "Tee",
    imageSrc: SHOP_ASSETS.occultEngravedPyramid,
    imageAlt: "Engraved gold pyramid print on a black and red stripe ground",
  },
  {
    title: "Engraved pyramid hoodie",
    price: HOODIE,
    garment: "Hoodie",
    imageSrc: SHOP_ASSETS.occultEngravedPyramid,
    imageAlt: "Engraved gold pyramid print on a black and red stripe ground",
  },
  {
    title: "White triangle tee",
    price: TEE,
    garment: "Tee",
    imageSrc: SHOP_ASSETS.occultWhiteTriangle,
    imageAlt: "White triangle print on a red and teal stripe ground",
  },
  {
    title: "White triangle hoodie",
    price: HOODIE,
    garment: "Hoodie",
    imageSrc: SHOP_ASSETS.occultWhiteTriangle,
    imageAlt: "White triangle print on a red and teal stripe ground",
  },
  {
    title: "Orange stripe tee",
    price: TEE,
    garment: "Tee",
    imageSrc: SHOP_ASSETS.occultOrangeStripes,
    imageAlt: "Gold pyramid print on an orange and black stripe ground",
  },
  {
    title: "Orange stripe hoodie",
    price: HOODIE,
    garment: "Hoodie",
    imageSrc: SHOP_ASSETS.occultOrangeStripes,
    imageAlt: "Gold pyramid print on an orange and black stripe ground",
  },
];
