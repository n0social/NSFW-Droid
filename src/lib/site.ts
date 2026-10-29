export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.nsfwdroid.com";

export const siteName = "NSFW Droid";

/** Default Open Graph / Twitter card image (1200×630) for pages without a custom image. */
export const defaultOgImagePath = "/og-default.png";

export const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
