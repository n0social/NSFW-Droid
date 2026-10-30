import { siteName, siteUrl } from "@/lib/site";

/** Homepage WebSite graph node for rich results / entity clarity. */
export function buildSiteWebSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    inLanguage: "en-US",
    description:
      "Browse mature games on itch.io, Steam, and partner stores. Outbound links only — purchases on official storefronts.",
  };
}
