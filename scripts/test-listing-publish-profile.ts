import {
  candidateMatchesCoverOptionalOverride,
  getCoverOptionalListingsSync,
} from "../src/lib/cover-optional-listings";
import {
  candidateHasPublishableStoreCover,
  storeCoverUrlFromIngest,
} from "../src/lib/listing-publish-profile";
import { publicCatalogCoverOrOverride } from "../src/lib/catalog-visibility";
import { listings } from "../src/db/schema";

const itchWithCover = candidateHasPublishableStoreCover({
  source: "itch",
  rawPayload: {
    imageurl: "https://img.itch.zone/aW1nLzEyMzQvLnBuZw==/315x250%23c/x.png",
  },
});
if (!itchWithCover) {
  throw new Error("expected itch RSS imageurl to count as publishable cover");
}

const itchNoCover = candidateHasPublishableStoreCover({
  source: "itch",
  rawPayload: {
    description: '<img alt="Mercenary Quest"/>',
  },
});
if (itchNoCover) {
  throw new Error("expected empty itch img tag without src to be incomplete");
}

const steamCover = storeCoverUrlFromIngest("steam", {
  appId: 123,
});
if (!steamCover?.includes("/123/header.jpg")) {
  throw new Error("expected steam appId header fallback");
}

const entries = getCoverOptionalListingsSync();
const coc2 = candidateMatchesCoverOptionalOverride(
  {
    outboundUrl: "https://incontinentcell.itch.io/corruption-of-champions-2",
    externalId: "https://incontinentcell.itch.io/corruption-of-champions-2",
  },
  entries,
);
if (!coc2) {
  throw new Error("expected CoC2 in cover-optional-listings.json");
}

const coverSql = publicCatalogCoverOrOverride();
if (!coverSql) {
  throw new Error("publicCatalogCoverOrOverride should return a condition");
}
if (!listings.coverImageUrl) {
  throw new Error("schema should expose coverImageUrl");
}

console.log("test-listing-publish-profile: ok");
