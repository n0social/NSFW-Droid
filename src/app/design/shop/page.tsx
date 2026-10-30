import type { Metadata } from "next";
import { ShopLayoutMockup } from "@/components/design/ShopLayoutMockup";

export const metadata: Metadata = {
  title: "Shop layout mockup (dev)",
  robots: { index: false, follow: false },
};

/** Dev-only visual mockup for standard shop IA — no checkout backend. */
export default function DesignShopPage() {
  return <ShopLayoutMockup />;
}
