import assert from "node:assert/strict";
import { hubPageMetadata } from "../src/lib/hub-page-metadata";

assert.equal(hubPageMetadata("/new", "New NSFW games", "x").alternates?.canonical, "/new");
console.log("test-hub-page-metadata: ok");
