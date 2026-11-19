import assert from "node:assert/strict";
import {
  adsPublicConfigFromEnv,
  exoclickPopunderLiveReadyFromConfig,
  shouldShowPlayPopunderFromConfig,
} from "../src/lib/ads-public-config";

const off = adsPublicConfigFromEnv({
  NEXT_PUBLIC_ADS_ENABLED: "0",
});
assert.equal(shouldShowPlayPopunderFromConfig(off, true), false);

const on = adsPublicConfigFromEnv({
  NEXT_PUBLIC_ADS_ENABLED: "1",
  NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER: "6062592",
  NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER_MOBILE: "6062594",
});
assert.equal(exoclickPopunderLiveReadyFromConfig(on), true);
assert.equal(shouldShowPlayPopunderFromConfig(on, true), true);
assert.equal(shouldShowPlayPopunderFromConfig(on, false), false);
assert.equal(on.popunderScriptSrc, "/exoclick-popunder.js");

console.log("test-ads-runtime-config: ok");