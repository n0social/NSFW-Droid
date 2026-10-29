import type { MetadataRoute } from "next";
import { catalogRobotsAllow, catalogRobotsDisallow } from "@/lib/robots-paths";
import { siteUrl } from "@/lib/site";

const catalogRules = {
  allow: [...catalogRobotsAllow],
  disallow: [...catalogRobotsDisallow],
};

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        ...catalogRules,
      },
      {
        userAgent: "*",
        ...catalogRules,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
