import type { Metadata } from "next";
import { siteName } from "@/lib/site";

function hubTitleLabel(title: Metadata["title"]): string {
  if (typeof title === "string") return title;
  if (!title || typeof title !== "object") return siteName;
  if ("absolute" in title && title.absolute) return title.absolute;
  if ("default" in title && title.default) return title.default;
  return siteName;
}

/** Static catalog hub routes (`/`, `/new`, `/videos`, `/creators/*`). */
export function hubPageMetadata(
  path: string,
  title: Metadata["title"],
  description: string,
): Metadata {
  const label = hubTitleLabel(title);
  const openGraphTitle = label.includes(siteName) ? label : `${label} · ${siteName}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: openGraphTitle,
      description,
      url: path,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: label,
      description,
    },
  };
}
