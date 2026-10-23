/**
 * Same-tab outbound: /api/go or /api/outbound → server ExoClick ping → 302 (no HTML, no window.open).
 */
import assert from "node:assert/strict";
import { shouldServeExoclickRedirectInterstitial } from "../src/lib/exoclick-go-interstitial";
import {
  buildExoclickPopunderClickUrl,
  EXOCLICK_POPUNDER_REFERRER_HOME,
  EXOCLICK_SYNDICATION_HOST,
} from "../src/lib/exoclick-popunder-syndication";

const zoneId = "6062592";
const syndicationUrl = buildExoclickPopunderClickUrl(zoneId, EXOCLICK_POPUNDER_REFERRER_HOME);

assert.ok(syndicationUrl.includes(`https://${EXOCLICK_SYNDICATION_HOST}/v1/link.php`));

assert.equal(
  shouldServeExoclickRedirectInterstitial(
    true,
    { source: "itch", officialUrl: "https://x.itch.io/y", affiliateUrl: null },
  ),
  false,
);

console.log("test-exoclick-popunder-workflow: ok");
console.log("  play: /api/go → server syndication fetch → 302 store");
console.log("  outbound: /api/outbound?u= → server fetch → 302 publisher");
