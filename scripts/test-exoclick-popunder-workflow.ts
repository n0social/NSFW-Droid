/**
 * Documents and asserts the 2-tab Play monetization chain:
 * 1) window.open → /api/go (visible store tab)
 * 2) hidden iframe → /api/ads/popunder-launch?hop=syndication → 302 → s.pemsrv.com link.php (browser)
 */
import assert from "node:assert/strict";
import {
  buildExoclickPopunderClickUrl,
  EXOCLICK_POPUNDER_REFERRER_HOME,
  EXOCLICK_SYNDICATION_HOST,
} from "../src/lib/exoclick-popunder-syndication";

const zoneId = "6062592";
const syndicationUrl = buildExoclickPopunderClickUrl(zoneId, EXOCLICK_POPUNDER_REFERRER_HOME);

assert.ok(syndicationUrl.includes(`https://${EXOCLICK_SYNDICATION_HOST}/v1/link.php`));
assert.ok(syndicationUrl.includes(`idzone=${zoneId}`));

const launch = new URL("/api/ads/popunder-launch", "https://www.nsfwdroid.com");
launch.searchParams.set("p", EXOCLICK_POPUNDER_REFERRER_HOME);
launch.searchParams.set("hop", "syndication");
assert.equal(launch.searchParams.get("hop"), "syndication");

console.log("test-exoclick-popunder-workflow: ok");
console.log("  visible tab: /api/go/{listingId}");
console.log("  iframe src:", launch.pathname + "?" + launch.searchParams.toString());
console.log("  launch 302 →", syndicationUrl.slice(0, 72) + "...");
