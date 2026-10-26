import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { ExoClickScript } from "@/components/ExoClickScript";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { PwaInstallPrompt } from "@/components/site/PwaInstallPrompt";
import { shouldShowFooterAds } from "@/lib/ads-config";
import { browseCatalogPath } from "@/lib/browse-catalog-path";
import { BROWSE_PLATFORM_HUBS } from "@/lib/browse-platforms";
import { siteName, siteUrl } from "@/lib/site";

type Props = {
  ageVerified: boolean;
  /** When false, skip footer ExoClick (sign-in, account, settings, etc.). Default true. */
  showFooterAds?: boolean;
};

export function SiteFooter({ ageVerified, showFooterAds = true }: Props) {
  const year = new Date().getFullYear();
  const footerAdsLive = showFooterAds && shouldShowFooterAds(ageVerified);

  return (
    <footer className="mt-12 border-t border-[#241033] bg-[#241033]">
      {footerAdsLive && <ExoClickScript ageVerified={ageVerified} />}
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-2 md:px-6 lg:px-8">
        <NewsletterSignup />
        {footerAdsLive && (
          <div className="mb-3 text-center">
            <p className="text-[10px] font-semibold leading-snug text-[#E9D5FF]/70 sm:text-[11px]">
              All Steam links are ad-free in order to keep account privacy for our viewers.
            </p>
            <AdSlot placement="footer-banner" ageVerified={ageVerified} />
          </div>
        )}
        <PwaInstallPrompt ageVerified={ageVerified} />
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-center text-[11px] font-semibold text-[#E9D5FF]/80 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:text-left md:px-6 lg:px-8">
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-3 sm:justify-start">
          <Link href="/browse" className="inline-flex min-h-[44px] items-center hover:text-[#FF4D8D] sm:min-h-0">
            Browse
          </Link>
          {BROWSE_PLATFORM_HUBS.map((hub) => (
            <Link
              key={hub.slug}
              href={browseCatalogPath({ platform: hub.slug })}
              className="inline-flex min-h-[44px] items-center hover:text-[#FF4D8D] sm:min-h-0"
            >
              {hub.label}
            </Link>
          ))}
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
