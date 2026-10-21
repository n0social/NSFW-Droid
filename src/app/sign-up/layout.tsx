import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo-private";

export const metadata: Metadata = privatePageMetadata("Sign up");

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
