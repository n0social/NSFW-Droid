import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";

export const metadata = { title: "Terms" };

export default async function TermsPage() {
  const ageVerified = await isAgeVerifiedRequest();

  return (
    <div className="min-h-screen bg-[#14061C] text-[#FFF1F7]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/" className="text-xs font-bold text-[#FF4D8D]">← Store</Link>
        <h1 className="mt-4 text-2xl font-black">Terms of use</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#E9D5FF]/90">
          NSFW Droid is an 18+ catalog that links to third-party stores. You must be of legal age in
          your jurisdiction. We do not sell games directly in Phase 1. Content and purchases are
          governed by each linked storefront. This page will be expanded with counsel before broad
          marketing.
        </p>
      </div>
      <SiteFooter ageVerified={ageVerified} />
    </div>
  );
}
