import { cookies } from "next/headers";
import { hubPageMetadata } from "@/lib/hub-page-metadata";
import { VideosPage } from "@/components/VideosPage";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";
import { BLUR_COVERS_COOKIE, parseBlurCovers } from "@/lib/cookies";
import { getPublishedListingCount } from "@/lib/listings";
import { getTopVideos, hasEnabledTopVideoListing } from "@/lib/video-feeds";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";
import { resolveLayoutDecorForTheme } from "@/lib/themes/layout-decor";

export const dynamic = "force-dynamic";

export const metadata = hubPageMetadata(
  "/videos",
  "Top videos",
  "Outbound links to popular SFM and animation clips from SFM Compile. NSFW Droid does not host video files.",
);

export default async function VideosRoutePage() {
  const jar = await cookies();
  const ageVerified = await isAgeVerifiedRequest();
  const blurCovers = parseBlurCovers(jar.get(BLUR_COVERS_COOKIE)?.value);

  const { active } = await resolveThemeForRequest();
  const themeAssets = themeDecorUrls(active.id);
  const layoutDecor = resolveLayoutDecorForTheme(active);

  const listingCount = await getPublishedListingCount();
  const data = hasEnabledTopVideoListing()
    ? await getTopVideos(48)
    : { items: [], sources: [], fetchedAt: new Date().toISOString() };

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <VideosPage
        layoutDecor={layoutDecor}
        ageVerified={ageVerified}
        blurCovers={blurCovers}
        listingCount={listingCount}
        data={data}
        themeAssets={themeAssets}
      />
    </div>
  );
}
