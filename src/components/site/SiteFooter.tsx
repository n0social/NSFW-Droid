import Link from "next/link";
import { siteName, siteUrl } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-[#241033] bg-[#241033]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-center text-[11px] font-semibold text-[#E9D5FF]/80 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:text-left md:px-6 lg:px-8">
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-3 sm:justify-start">
          <Link href="/terms" className="inline-flex min-h-[44px] items-center hover:text-[#FF4D8D] sm:min-h-0">
            Terms
          </Link>
          <Link href="/privacy" className="inline-flex min-h-[44px] items-center hover:text-[#FF4D8D] sm:min-h-0">
            Privacy
          </Link>
          <Link href="/affiliate" className="inline-flex min-h-[44px] items-center hover:text-[#FF4D8D] sm:min-h-0">
            Affiliate disclosure
          </Link>
          <Link href="/dmca" className="inline-flex min-h-[44px] items-center hover:text-[#FF4D8D] sm:min-h-0">
            DMCA
          </Link>
        </nav>
        <p className="text-[#E9D5FF]/60">
          © {year} {siteName}. Catalog links only — purchases on partner stores.
        </p>
        <p className="text-[10px] text-[#E9D5FF]/40">{siteUrl.replace(/^https?:\/\//, "")}</p>
      </div>
    </footer>
  );
}
