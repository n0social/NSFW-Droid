/**
 * ISR window for public catalog pages (home, browse, game detail, sitemap).
 *
 * These routes still read cookies for the age gate and blur preference, so Next.js
 * renders them per request. `revalidate` does not cache personalized HTML; it sets the
 * default revalidation interval for static segments (e.g. sitemap) and for `fetch` /
 * `unstable_cache` used while building catalog data.
 */
export const CATALOG_PAGE_REVALIDATE_SECONDS = 3600;
