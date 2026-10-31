import assert from "node:assert/strict";
import { browseCatalogPath } from "../src/lib/browse-catalog-path";

assert.equal(browseCatalogPath({}), "/browse");
assert.equal(browseCatalogPath({ page: 2 }), "/browse?page=2");
assert.equal(browseCatalogPath({ tag: "rpg", page: 3 }), "/browse?tag=rpg&page=3");
assert.equal(browseCatalogPath({ platform: "android" }), "/browse?platform=android");
console.log("test-browse-catalog-path: ok");
