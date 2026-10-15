import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";

export const metadata = { title: "DMCA" };

export default async function DmcaPage() {
  const ageVerified = await isAgeVerifiedRequest();

  return (
    <div className="min-h-screen bg-[#14061C] text-[#FFF1F7]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/" className="text-xs font-bold text-[#FF4D8D]">← Store</Link>
        <h1 className="mt-4 text-2xl font-black">DMCA</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#E9D5FF]/90">
          Copyright complaints and counter-notice contact information will be published here before
          broad marketing. Listings link to third-party stores; takedown requests may also be
          directed to those platforms.
        </p>
      </div>
      <SiteFooter ageVerified={ageVerified} />
    </div>
  );
}
