import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

function runCase(env: Record<string, string | undefined>, expectedReady: boolean) {
  const merged = { ...process.env, ...env };
  for (const key of Object.keys(env)) {
    if (env[key] === undefined) delete merged[key];
  }
  const r = spawnSync(
    "npx",
    ["tsx", "-e", `import { shouldShowPlayPopunder, exoclickPopunderLiveReady, exoclickPopunderScriptSrc } from './src/lib/ads-config.ts';
console.log(JSON.stringify({
  ready: exoclickPopunderLiveReady(),
  show: shouldShowPlayPopunder(true),
  src: exoclickPopunderScriptSrc() ?? null,
}));`],
    { cwd: process.cwd(), env: merged, encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error("spawn failed");
  }
  const data = JSON.parse(r.stdout.trim()) as {
    ready: boolean;
    show: boolean;
    src: string | null;
  };
  assert.equal(data.ready, expectedReady);
  assert.equal(data.show, expectedReady);
  return data;
}

runCase(
  {
    NEXT_PUBLIC_ADS_ENABLED: "0",
    NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER: undefined,
  },
  false,
);

const on = runCase(
  {
    NEXT_PUBLIC_ADS_ENABLED: "1",
    NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER: "999888",
  },
  true,
);
assert.equal(on.src, "/exoclick-popunder.js");

import {
  EXOCLICK_PLAY_OUTBOUND_TRIGGER_CLASS,
  outboundPlayLinkClassName,
} from "../src/lib/outbound-play-link";
assert.equal(EXOCLICK_PLAY_OUTBOUND_TRIGGER_CLASS, "nsfwdroid-play-outbound");
assert.equal(outboundPlayLinkClassName("btn"), "nsfwdroid-play-outbound btn");

console.log("test-ads-popunder-config: ok");
