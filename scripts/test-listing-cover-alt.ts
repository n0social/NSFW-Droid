import { readFileSync } from "node:fs";
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

console.log("test-listing-cover-alt: ok");
