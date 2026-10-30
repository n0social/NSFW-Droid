/** Public paths for owner-approved merch art (`public/shop/`). */
export const SHOP_PUBLIC = "/shop";

export const shopAsset = (filename: string) => `${SHOP_PUBLIC}/${filename}`;

export const SHOP_ASSETS = {
  logoBanner16x9: shopAsset("nsfw-droid-logo-banner-16x9.jpg"),
  pandaHoodieV2: shopAsset("nsfw-droid-shop-vesper-panda-hoodie-solo-no-text-v2.jpg"),
  chibiDealBannerV2: shopAsset("nsfw-droid-shop-vesper-chibi-deal-big-bust-banner-v2.jpg"),
  chibiSaleV1BannerV2: shopAsset("nsfw-droid-shop-vesper-chibi-sale-big-bust-v1-banner-v2.jpg"),
  chibiSaleV2BannerV2: shopAsset("nsfw-droid-shop-vesper-chibi-sale-big-bust-v2-banner-v2.jpg"),
  chibiNewBannerV2: shopAsset("nsfw-droid-shop-vesper-chibi-new-item-big-bust-banner-v2.jpg"),
  chibiLimitedBannerV2: shopAsset("nsfw-droid-shop-vesper-chibi-limited-big-bust-banner-v2.jpg"),
  chibiClearanceBannerV2: shopAsset("nsfw-droid-shop-vesper-chibi-clearance-big-bust-banner-v2.jpg"),
  peaceDuoV2: shopAsset("nsfw-droid-shop-vesper-panda-andri-peace-sticker-v2.jpg"),
  andriStickerSheet: shopAsset("nsfw-droid-shop-andri-sticker-sheet.jpg"),
} as const;
