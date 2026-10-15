import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";

export const metadata = { title: "Privacy" };

export default async function PrivacyPage() {
  const ageVerified = await isAgeVerifiedRequest();

  return (
    <div className="min-h-screen bg-[#14061C] text-[#FFF1F7]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/" className="text-xs font-bold text-[#FF4D8D]">← Store</Link>
        <h1 className="mt-4 text-2xl font-black">Privacy</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#E9D5FF]/90">
          We use first-party analytics (outbound clicks and listing views) to rank catalog rails. When
          configured, Google Analytics may also collect usage data per Google&apos;s policies. Age
          verification cookies are used to remember your 18+ confirmation on this device. When
          display ads are enabled, our ad partners (such as ExoClick) may set their own cookies or
          use similar technologies to measure and serve ads. Contact
          details for data requests will be published here before launch marketing.
        </p>
      </div>
      <SiteFooter ageVerified={ageVerified} />
    </div>
  );
}
