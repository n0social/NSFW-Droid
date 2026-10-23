import assert from "node:assert/strict";
import {
  buildExoclickPopunderClickUrl,
  EXOCLICK_POPUNDER_LAUNCH_PATH,
  EXOCLICK_POPUNDER_REFERRER_HOME,
} from "../src/lib/exoclick-popunder-syndication";

assert.equal(EXOCLICK_POPUNDER_LAUNCH_PATH, "/api/ads/popunder-launch");

const url = buildExoclickPopunderClickUrl("6062592", EXOCLICK_POPUNDER_REFERRER_HOME);
assert.ok(url.includes("s.pemsrv.com/v1/link.php"));
assert.ok(url.includes("idzone=6062592"));
assert.ok(url.includes(encodeURIComponent(EXOCLICK_POPUNDER_REFERRER_HOME)));

console.log("test-exoclick-popunder-launch: ok");
