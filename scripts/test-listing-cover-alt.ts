import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import { displayListingTitle, listingCoverImageAlt } from "../src/lib/listing-display";

const stripped = displayListingTitle("[Windows] Neon Nights [Free]");
const alt = listingCoverImageAlt(stripped);
if (alt !== "Neon Nights") {
  throw new Error(`listingCoverImageAlt: expected "Neon Nights", got "${alt}"`);
}
if (listingCoverImageAlt("  ") !== "Game cover") {
  throw new Error('listingCoverImageAlt: expected fallback "Game cover" for blank title');
}

const gameCard = readFileSync("src/components/GameCard.tsx", "utf8");
const gameDetail = readFileSync("src/components/GameDetailPage.tsx", "utf8");
if (!gameCard.includes("alt={listingCoverImageAlt(displayTitle)}")) {
  throw new Error("GameCard cover img must use listingCoverImageAlt(displayTitle)");
}
if (!gameDetail.includes("alt={listingCoverImageAlt(displayTitle)}")) {
  throw new Error("GameDetailPage cover img must use listingCoverImageAlt(displayTitle)");
}

const cardCoverAlt = gameCard.indexOf("alt={listingCoverImageAlt(displayTitle)}");
const cardInternalLink = gameCard.indexOf("href={gameListingPath(game.slug)}");
if (cardInternalLink < 0 || cardInternalLink > cardCoverAlt) {
  throw new Error("GameCard cover must stay an internal /game/{slug} link");
}

const detailCoverAlt = gameDetail.indexOf("alt={listingCoverImageAlt(displayTitle)}");
const detailCoverPlay = gameDetail.lastIndexOf("<OutboundPlayLink", detailCoverAlt);
const detailCoverPlayEnd = gameDetail.indexOf("</OutboundPlayLink>", detailCoverAlt);
const detailTitle = gameDetail.indexOf("<h1", detailCoverAlt);
if (detailCoverPlay < 0 || detailCoverPlayEnd < 0) {
  throw new Error("GameDetailPage cover must use OutboundPlayLink");
}
const coverPlay = gameDetail.slice(detailCoverPlay, detailCoverPlayEnd);
if (!coverPlay.includes("href={playHref}")) {
  throw new Error("GameDetailPage cover play control must use the same playHref as Play on store");
}
if (!coverPlay.includes("listing={listing}") || !coverPlay.includes("ageVerified={ageVerified}")) {
  throw new Error("GameDetailPage cover must pass the same listing and age gate as Play on store");
}
if (!coverPlay.includes("aria-label={`Play ${displayTitle} on store`}")) {
  throw new Error('GameDetailPage cover must be named "Play {title} on store"');
}
if (detailTitle < 0 || detailCoverPlayEnd > detailTitle) {
  throw new Error("GameDetailPage title must stay a heading outside the cover play control");
}

type PlayListing = {
  source: "itch" | "steam";
  officialUrl: string;
  affiliateUrl: null;
};

async function assertPlayControlMarkup() {
  process.env.NEXT_PUBLIC_ADS_ENABLED = "1";
  process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER = "6062592";

  const playBundlePath = path.resolve("scripts/.tmp-play-link.mjs");
  try {
    await build({
      entryPoints: [path.resolve("src/components/OutboundPlayLink.tsx")],
      bundle: true,
      format: "esm",
      platform: "node",
      jsx: "automatic",
      outfile: playBundlePath,
      alias: { "@": path.resolve("src") },
      external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    });
    const { OutboundPlayLink } = (await import(pathToFileURL(playBundlePath).href)) as {
      OutboundPlayLink: ComponentType<{
        listing: PlayListing;
        href: string;
        ageVerified: boolean;
        "aria-label": string;
        children?: ReactNode;
      }>;
    };

    const itchListing: PlayListing = {
      source: "itch",
      officialUrl: "https://example.itch.io/neon-nights",
      affiliateUrl: null,
    };
    const steamListing: PlayListing = {
      source: "steam",
      officialUrl: "https://store.steampowered.com/app/1",
      affiliateUrl: null,
    };

    function renderPlay(listing: PlayListing, ageVerified: boolean) {
      return renderToStaticMarkup(
        createElement(
          OutboundPlayLink,
          {
            listing,
            href: "/api/go/listing-id",
            ageVerified,
            "aria-label": "Play Neon Nights on store",
          },
          createElement("img", { alt: "Neon Nights" }),
        ),
      );
    }

    const itchAds = renderPlay(itchListing, true);
    if (
      !itchAds.startsWith("<a ") ||
      !itchAds.includes('href="/api/go/listing-id"') ||
      !itchAds.includes("nsfwdroid-play-outbound")
    ) {
      throw new Error(`non-Steam Play with ads on must be a classed link, got ${itchAds}`);
    }
    if (
      !itchAds.includes('aria-label="Play Neon Nights on store"') ||
      !itchAds.includes('alt="Neon Nights"')
    ) {
      throw new Error("Play control must keep its name and the cover image");
    }

    const steamAds = renderPlay(steamListing, true);
    if (!steamAds.includes('href="/api/go/listing-id"') || steamAds.startsWith("<button")) {
      throw new Error(`Steam Play must stay a same-tab link with no popunder button, got ${steamAds}`);
    }

    const itchLoggedOut = renderPlay(itchListing, false);
    if (!itchLoggedOut.includes('href="/api/go/listing-id"') || itchLoggedOut.startsWith("<button")) {
      throw new Error(`Play before age verification must not pop under, got ${itchLoggedOut}`);
    }

    console.log("test-listing-cover-alt: ok");
  } finally {
    rmSync(playBundlePath, { force: true });
  }
}

void assertPlayControlMarkup();
