import assert from "node:assert/strict";
import { externalIdSlugSuffix, slugify, titleSlugBase } from "../src/lib/slug";

assert.equal(titleSlugBase("Charmed~!"), "charmed");
const itchUrl = "https://impcharm.itch.io/charmed";
const initial = slugify("Charmed~!", itchUrl);
assert.ok(initial.includes("impcharm"));
assert.notEqual(initial, "charmed--itch-io-charmed");
assert.equal(externalIdSlugSuffix(itchUrl), "impcharm-charmed");
console.log(JSON.stringify({ ok: true, initial }));
