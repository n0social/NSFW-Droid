import assert from "node:assert/strict";
import { buildSiteWebSiteJsonLd } from "../src/lib/site-json-ld";
import { siteName, siteUrl } from "../src/lib/site";

const jsonLd = buildSiteWebSiteJsonLd();
assert.equal(jsonLd["@type"], "WebSite");
assert.equal(jsonLd.name, siteName);
assert.equal(jsonLd.url, siteUrl);
assert.ok(typeof jsonLd.description === "string" && jsonLd.description.length > 20);

console.log("test-site-json-ld: ok");
