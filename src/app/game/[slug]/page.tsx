import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GameDetailPage } from "@/components/GameDetailPage";
import {
  AGE_VERIFIED_COOKIE,
  BLUR_COVERS_COOKIE,
  parseAgeVerified,
  parseBlurCovers,
} from "@/lib/cookies";
import {
  getPublishedListingBySlug,
  getSimilarListings,
  getTagsForListingDetail,
  listingMetaDescription,
} from "@/lib/listing-detail";
import { buildListingJsonLd } from "@/lib/listing-json-ld";
import { gameListingPath } from "@/lib/listing-routes";
import { getPublishedListingCount } from "@/lib/listings";
import { displayListingTitle } from "@/lib/listing-display";
import { siteName } from "@/lib/site";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { themeDecorUrls } from "@/lib/themes/asset-url";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getPublishedListingBySlug(slug);
  if (!listing) {
    return { title: "Game not found", robots: { index: false, follow: false } };
  }

  const tags = await getTagsForListingDetail(listing.id);
  const title = displayListingTitle(listing.title);
  const description = listingMetaDescription(listing, tags.map((t) => t.label));
  const path = gameListingPath(listing.slug);
  const cover = listing.coverImageUrl?.trim();
  const images = cover ? [{ url: cover, alt: title }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} · ${siteName}`,
      description,
      url: path,
      type: "website",
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function GameListingPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getPublishedListingBySlug(slug);
  if (!listing) notFound();

  const jar = await cookies();
  const ageVerified = parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value);
  const blurCovers = parseBlurCovers(jar.get(BLUR_COVERS_COOKIE)?.value);

  const tags = await getTagsForListingDetail(listing.id);
  const tagLabels = tags.map((t) => t.label);
  const description = listingMetaDescription(listing, tagLabels);
  const jsonLd = buildListingJsonLd(listing, description);
  const similarGames = await getSimilarListings(listing.id);
  const listingCount = await getPublishedListingCount();
  const { active } = await resolveThemeForRequest();
  const themeAssets = themeDecorUrls(active.id);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GameDetailPage
        listing={listing}
        tags={tags}
        similarGames={similarGames}
        ageVerified={ageVerified}
        blurCovers={blurCovers}
        listingCount={listingCount}
        themeAssets={themeAssets}
      />
    </>
  );
}
