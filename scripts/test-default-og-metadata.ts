/**
 * Smoke test: default OG/Twitter wiring (no Next layout import — avoids CSS load).
 * Run: npx tsx scripts/test-default-og-metadata.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { defaultOgImagePath, siteName, siteUrl } from "../src/lib/site";

assert.equal(defaultOgImagePath, "/og-default.png");
assert.ok(existsSync("public/og-default.png"), "public/og-default.png must exist");

const layout = readFileSync("src/app/layout.tsx", "utf8");
assert.match(layout, /import \{ defaultOgImagePath, siteName, siteUrl \} from "@\/lib\/site"/);
assert.match(layout, /card: "summary_large_image"/);
assert.match(layout, /images: \[defaultOgImagePath\]/);

const absolute = new URL(defaultOgImagePath, siteUrl).href;
assert.equal(absolute, `${siteUrl.replace(/\/$/, "")}/og-default.png`);

console.log(JSON.stringify({ ok: true, siteName, absoluteOgUrl: absolute }, null, 2));
