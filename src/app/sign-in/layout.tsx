import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo-private";

export const metadata: Metadata = privatePageMetadata("Sign in");

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
