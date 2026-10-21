import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo-private";

export const metadata: Metadata = privatePageMetadata("Settings");

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
