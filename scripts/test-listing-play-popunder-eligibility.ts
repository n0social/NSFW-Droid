import assert from "node:assert/strict";
import {
  isSteamOutboundUrl,
  listingEligibleForPlayPopunder,
  urlEligibleForOutboundPopunder,
} from "../src/lib/outbound-link";

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

assert.equal(isSteamOutboundUrl("https://store.steampowered.com/app/1/"), true);
assert.equal(isSteamOutboundUrl("https://steamcommunity.com/groups/foo"), true);
assert.equal(urlEligibleForOutboundPopunder("https://creator.itch.io/game"), true);
assert.equal(urlEligibleForOutboundPopunder("https://store.steampowered.com/app/1/"), false);

console.log("test-listing-play-popunder-eligibility: ok");
