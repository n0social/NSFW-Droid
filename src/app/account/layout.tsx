import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo-private";

export const metadata: Metadata = privatePageMetadata("Account");

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
