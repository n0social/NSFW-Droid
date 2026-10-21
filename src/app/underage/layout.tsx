import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo-private";

export const metadata: Metadata = privatePageMetadata("18+ only");

export default function UnderageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
