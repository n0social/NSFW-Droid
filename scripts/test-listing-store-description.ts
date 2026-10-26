import assert from "node:assert/strict";
import {
  plainTextFromStoreHtml,
  storeDescriptionFromRawPayload,
  listingSynopsisForSeo,
} from "../src/lib/listing-store-description";

assert.equal(plainTextFromStoreHtml("<p>Hello<br/>world</p>"), "Hello world");

const steam = storeDescriptionFromRawPayload("steam", {
  steam: { short_description: "A tactical RPG with romance." },
});
assert.equal(steam, "A tactical RPG with romance.");

const itch = storeDescriptionFromRawPayload("itch", {
  description: "<p>NSFW visual novel.</p>",
});
assert.equal(itch, "NSFW visual novel.");

const seo = listingSynopsisForSeo(
  { storeDescription: "A long enough store synopsis that should win over the template." },
  "template fallback",
);
assert.match(seo, /store synopsis/);

const short = listingSynopsisForSeo({ storeDescription: "Too short" }, "template fallback");
assert.equal(short, "template fallback");

console.log("test-listing-store-description: ok");
