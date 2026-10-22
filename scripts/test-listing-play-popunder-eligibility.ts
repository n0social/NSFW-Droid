import assert from "node:assert/strict";
import { listingEligibleForPlayPopunder } from "../src/lib/outbound-link";

assert.equal(
  listingEligibleForPlayPopunder({
    source: "steam",
    officialUrl: "https://store.steampowered.com/app/123/",
    affiliateUrl: null,
  }),
  false,
);

assert.equal(
  listingEligibleForPlayPopunder({
    source: "itch",
    officialUrl: "https://creator.itch.io/my-game",
    affiliateUrl: "https://creator.itch.io/my-game?ac=partner",
  }),
  true,
);

assert.equal(
  listingEligibleForPlayPopunder({
    source: "manual",
    officialUrl: "https://www.nutaku.net/games/example/",
    affiliateUrl: null,
  }),
  true,
);

assert.equal(
  listingEligibleForPlayPopunder({
    source: "itch",
    officialUrl: "https://store.steampowered.com/app/999/",
    affiliateUrl: null,
  }),
  false,
);

console.log("test-listing-play-popunder-eligibility: ok");
