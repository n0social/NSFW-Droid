import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";

export const metadata = { title: "Affiliate disclosure" };

export default async function AffiliatePage() {
  const ageVerified = await isAgeVerifiedRequest();

  return (
    <div className="min-h-screen bg-[#14061C] text-[#FFF1F7]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/" className="text-xs font-bold text-[#FF4D8D]">← Store</Link>
        <h1 className="mt-4 text-2xl font-black">Affiliate disclosure</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#E9D5FF]/90">
          Some outbound links may include affiliate parameters after program approval (itch.io, Steam,
          Nutaku, and others). Sponsored or featured rows will be labeled on the storefront. Prices
          and checkout always occur on the partner site. When display ads are enabled on the
          storefront, ad partners may set cookies per their policies; see our{" "}
          <Link href="/privacy" className="text-[#FF4D8D] underline">Privacy</Link> page.
        </p>
      </div>
      <SiteFooter ageVerified={ageVerified} />
    </div>
  );
}
