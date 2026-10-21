import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/game/"],
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/account/",
        "/sign-in",
        "/sign-up",
        "/settings",
        "/settings/",
        "/newsletter",
        "/newsletter/",
        "/underage",
        "/underage/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
