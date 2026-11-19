/**
 * Popunder zones use ExoClick trigger method 2 (click a link with class
 * nsfwdroid-play-outbound). The official popunder1000.js tag must load after
 * the age gate. Play controls are real anchors with that class — not a hidden
 * iframe to link.php, which those zones do not count.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildExoclickPopunderClickUrl,
  EXOCLICK_POPUNDER_REFERRER_HOME,
  EXOCLICK_SYNDICATION_HOST,
} from "../src/lib/exoclick-popunder-syndication";
import { EXOCLICK_PLAY_OUTBOUND_TRIGGER_CLASS } from "../src/lib/outbound-play-link";

const zoneId = "6062592";
const syndicationUrl = buildExoclickPopunderClickUrl(zoneId, EXOCLICK_POPUNDER_REFERRER_HOME);
assert.ok(syndicationUrl.includes(`https://${EXOCLICK_SYNDICATION_HOST}/v1/link.php`));
assert.ok(syndicationUrl.includes(`idzone=${zoneId}`));

const play = readFileSync("src/components/OutboundPlayLink.tsx", "utf8");
assert.match(play, /outboundPlayLinkClassName/);
assert.match(play, /<a/);
assert.doesNotMatch(play, /firePlayStorePopunder/);
assert.doesNotMatch(play, /createElement\("iframe"\)/);
assert.doesNotMatch(play, /\.preventDefault\(/);

const pop = readFileSync("src/components/OutboundPopunderLink.tsx", "utf8");
assert.match(pop, /outboundPlayLinkClassName/);
assert.doesNotMatch(pop, /firePopunderThenNavigate/);
assert.doesNotMatch(pop, /\.preventDefault\(/);

const script = readFileSync("src/components/ExoClickPopunderScript.tsx", "utf8");
assert.match(script, /https:\/\/a\.pemsrv\.com\/popunder1000\.js/);
assert.match(script, /ad_trigger_method = 2/);
assert.match(script, /EXOCLICK_PLAY_OUTBOUND_TRIGGER_CLASS/);
assert.match(script, /ad_frequency_period = 60/);
assert.equal(EXOCLICK_PLAY_OUTBOUND_TRIGGER_CLASS, "nsfwdroid-play-outbound");

const footer = readFileSync("src/components/site/SiteFooter.tsx", "utf8");
assert.match(footer, /ExoClickPopunderScript/);

const go = readFileSync("src/app/api/go/[listingId]/route.ts", "utf8");
assert.doesNotMatch(go, /\bfetch\s*\(/);

console.log("test-exoclick-popunder-workflow: ok");
console.log("  trigger class:", EXOCLICK_PLAY_OUTBOUND_TRIGGER_CLASS);
console.log("  script: https://a.pemsrv.com/popunder1000.js trigger_method=2");
