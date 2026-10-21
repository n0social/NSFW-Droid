import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo-private";

export const metadata: Metadata = privatePageMetadata("Newsletter");

export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
