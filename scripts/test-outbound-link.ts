import {
  affiliatePairsWithOfficial,
  parseStoreTarget,
  resolveOutboundLink,
} from "../src/lib/outbound-link";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const steamOfficial = "https://store.steampowered.com/app/123456/Game/";
const steamAffiliate = "https://store.steampowered.com/app/123456/Game/?utm_source=test";
assert(
  affiliatePairsWithOfficial(steamOfficial, steamAffiliate),
  "steam utm should pair",
);
assert(
  !affiliatePairsWithOfficial(
    steamOfficial,
    "https://store.steampowered.com/app/999999/Other/",
  ),
  "different steam app should not pair",
);

const itchOfficial = "https://creator.itch.io/my-game";
const itchAffiliate = "https://creator.itch.io/my-game?ac=partner";
assert(affiliatePairsWithOfficial(itchOfficial, itchAffiliate), "itch ac= should pair");
assert(
  !affiliatePairsWithOfficial(itchOfficial, "https://other.itch.io/wrong-game"),
  "different itch slug should not pair",
);
assert(
  !affiliatePairsWithOfficial(steamOfficial, itchOfficial),
  "cross-store should not pair",
);

const resolved = resolveOutboundLink({
  officialUrl: steamOfficial,
  affiliateUrl: "https://other.itch.io/wrong-game",
});
assert(resolved.linkKind === "official", "go should fall back to official when affiliate mismatches");
assert(resolved.url === steamOfficial, "fallback url is official");

assert(parseStoreTarget(itchOfficial)?.key === "creator/my-game", "itch key parse");

import { feedItemMatchesSeed } from "./lib/itch-manual-seeds";

const seed = {
  title: "Corruption of Champions",
  officialUrl: "https://fenoxo.itch.io/corruption-of-champions",
};
assert(
  feedItemMatchesSeed("https://fenoxo.itch.io/corruption-of-champions", seed),
  "exact itch url should match seed",
);
assert(
  !feedItemMatchesSeed("https://other.itch.io/corruption-of-champions-mod", seed),
  "substring slug match on wrong creator should not match",
);

console.log("test-outbound-link: ok");
