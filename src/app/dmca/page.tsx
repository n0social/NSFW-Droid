import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata = { title: "DMCA" };

export default function DmcaPage() {
  return (
    <div className="min-h-screen bg-[#14061C] text-[#FFF1F7]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/" className="text-xs font-bold text-[#FF4D8D]">← Store</Link>
        <h1 className="mt-4 text-2xl font-black">Copyright / DMCA</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#E9D5FF]/90">
          NSFW Droid indexes titles and links; we do not host game binaries in Phase 1. If you believe
          a listing infringes your rights, send a notice with URL, work identification, and contact
          information. A designated agent email will be listed here before production traffic.
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
