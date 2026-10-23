import assert from "node:assert/strict";
import {
  buildExoclickPopunderClickUrl,
  EXOCLICK_POPUNDER_DESTINATION_PATH,
  EXOCLICK_POPUNDER_LAUNCH_PATH,
  EXOCLICK_POPUNDER_REFERRER_HOME,
  isGameStorePopunderDestination,
} from "../src/lib/exoclick-popunder-syndication";

assert.equal(EXOCLICK_POPUNDER_LAUNCH_PATH, "/api/ads/popunder-launch");
assert.equal(EXOCLICK_POPUNDER_DESTINATION_PATH, "/api/ads/popunder-destination");

const url = buildExoclickPopunderClickUrl("6062592", EXOCLICK_POPUNDER_REFERRER_HOME);
assert.ok(url.includes("s.pemsrv.com/v1/link.php"));
assert.ok(url.includes("idzone=6062592"));
assert.ok(url.includes(encodeURIComponent(EXOCLICK_POPUNDER_REFERRER_HOME)));

assert.equal(isGameStorePopunderDestination("https://foo.itch.io/bar"), true);
assert.equal(isGameStorePopunderDestination("https://stripchat.com/model"), false);

console.log("test-exoclick-popunder-launch: ok");
