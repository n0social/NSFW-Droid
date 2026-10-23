/**
 * Same-tab monetized outbound:
 * - Play → /api/go → HTML interstitial → store (one tab)
 * - Videos → /api/outbound?u= → interstitial → publisher (one tab)
 */
import assert from "node:assert/strict";
import {
  buildMonetizedRedirectInterstitialHtml,
  buildPopunderLaunchUrlForRequest,
} from "../src/lib/exoclick-go-interstitial";
import {
  buildExoclickPopunderClickUrl,
  EXOCLICK_POPUNDER_REFERRER_HOME,
  EXOCLICK_SYNDICATION_HOST,
} from "../src/lib/exoclick-popunder-syndication";

const zoneId = "6062592";
const syndicationUrl = buildExoclickPopunderClickUrl(zoneId, EXOCLICK_POPUNDER_REFERRER_HOME);

assert.ok(syndicationUrl.includes(`https://${EXOCLICK_SYNDICATION_HOST}/v1/link.php`));

const launch = buildPopunderLaunchUrlForRequest("https://www.nsfwdroid.com/api/go/test");
assert.ok(launch.includes("hop=syndication"));

const html = buildMonetizedRedirectInterstitialHtml("https://example.itch.io/game", launch);
assert.ok(html.includes("location.replace"));
assert.ok(html.includes("new Image"));

console.log("test-exoclick-popunder-workflow: ok");
console.log("  play: same tab /api/go → interstitial → itch");
console.log("  outbound: /api/outbound?u= → interstitial → target");
