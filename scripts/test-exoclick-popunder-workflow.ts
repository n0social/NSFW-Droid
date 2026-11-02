/**
 * Documents and asserts the browser popunder chain:
 * 1) window.open → /api/go or the outbound URL (visible tab)
 * 2) hidden iframe → /api/ads/popunder-launch?hop=syndication → 302 → s.pemsrv.com link.php
 *
 * A Node fetch of s.pemsrv.com does not bill and must not be wired into /api/go or /api/outbound.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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

const client = readFileSync("src/lib/exoclick-play-popunder-client.ts", "utf8");
assert.match(client, /createElement\("iframe"\)/);
assert.match(client, /hop", "syndication"/);
assert.match(client, /does not bill/);
assert.doesNotMatch(client, /\bfetch\s*\(/);

const go = readFileSync("src/app/api/go/[listingId]/route.ts", "utf8");
assert.match(go, /does not bill/);
assert.doesNotMatch(go, /scheduleExoclickPopunderSyndicationHit/);
assert.doesNotMatch(go, /\bfetch\s*\(/);

const outbound = readFileSync("src/app/api/outbound/route.ts", "utf8");
assert.match(outbound, /does not bill/);
assert.doesNotMatch(outbound, /scheduleExoclickPopunderSyndicationHit/);
assert.doesNotMatch(outbound, /fetch\s*\(/);

assert.equal(existsSync("src/lib/exoclick-popunder-server.ts"), false);
assert.equal(existsSync("src/lib/exoclick-go-interstitial.ts"), false);

const play = readFileSync("src/components/OutboundPlayLink.tsx", "utf8");
assert.match(play, /listingEligibleForPlayPopunder/);
assert.match(play, /firePlayStorePopunder/);
assert.doesNotMatch(play, /location\.assign/);

console.log("test-exoclick-popunder-workflow: ok");
console.log("  visible tab: /api/go/{listingId} or outbound URL");
console.log("  iframe src:", launch.pathname + "?" + launch.searchParams.toString());
console.log("  launch 302 →", syndicationUrl.slice(0, 72) + "...");
