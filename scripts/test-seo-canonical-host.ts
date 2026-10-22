import {
  primarySiteHost,
  redirectHostForCanonicalOrigin,
} from "../src/lib/canonical-host";

if (primarySiteHost() !== "www.nsfwdroid.com") {
  throw new Error(`unexpected primarySiteHost: ${primarySiteHost()}`);
}

if (redirectHostForCanonicalOrigin("www.nsfwdroid.com") !== null) {
  throw new Error("www should not redirect");
}
if (redirectHostForCanonicalOrigin("nsfwdroid.com") !== "www.nsfwdroid.com") {
  throw new Error("apex should redirect to www");
}
if (redirectHostForCanonicalOrigin("localhost:3847") !== null) {
  throw new Error("localhost should not redirect");
}

console.log("test-seo-canonical-host: ok");
