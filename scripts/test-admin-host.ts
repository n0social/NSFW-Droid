import assert from "node:assert/strict";
import { generateKeyPair, SignJWT } from "jose";
import { adminCookieOptions } from "../src/lib/admin-auth";
import {
  hostRedirectForRequest,
  isAdminAppPath,
  resolveAdminHostLocations,
} from "../src/lib/admin-host";
import {
  cloudflareAccessConfig,
  normalizeAccessTeamHost,
  readCfAccessJwt,
  verifyCfAccessJwt,
} from "../src/lib/cf-access";

const prod = resolveAdminHostLocations({
  NEXT_PUBLIC_SITE_URL: "https://www.nsfwdroid.com",
});
assert.equal(prod.adminBase, "https://admin.nsfwdroid.com");
assert.equal(prod.publicBase, "https://www.nsfwdroid.com");

const wwwAdmin = hostRedirectForRequest(
  "www.nsfwdroid.com",
  "/admin",
  "?from=www",
  prod,
);
assert.deepEqual(wwwAdmin, {
  location: "https://admin.nsfwdroid.com/admin?from=www",
  status: 308,
});

const wwwApi = hostRedirectForRequest(
  "www.nsfwdroid.com",
  "/api/admin/login",
  "?next=%2Fadmin",
  prod,
);
assert.equal(wwwApi?.location, "https://admin.nsfwdroid.com/api/admin/login?next=%2Fadmin");
assert.equal(wwwApi?.status, 308);

assert.equal(hostRedirectForRequest("www.nsfwdroid.com", "/browse", "", prod), null);
assert.equal(hostRedirectForRequest("WWW.NSFWDROID.COM", "/", "", prod), null);

const apexAdmin = hostRedirectForRequest("nsfwdroid.com", "/admin/queue", "", prod);
assert.equal(apexAdmin?.location, "https://admin.nsfwdroid.com/admin/queue");

assert.deepEqual(hostRedirectForRequest("admin.nsfwdroid.com", "/", "?x=1", prod), {
  location: "https://admin.nsfwdroid.com/admin?x=1",
  status: 308,
});
assert.equal(hostRedirectForRequest("admin.nsfwdroid.com", "/admin/login", "", prod), null);
assert.equal(hostRedirectForRequest("admin.nsfwdroid.com", "/api/admin/dashboard", "", prod), null);
assert.equal(hostRedirectForRequest("admin.nsfwdroid.com", "/favicon.ico", "", prod), null);
assert.equal(
  hostRedirectForRequest("admin.nsfwdroid.com", "/_next/static/chunks/app.js", "", prod),
  null,
);

const catalogOnAdmin = hostRedirectForRequest(
  "admin.nsfwdroid.com",
  "/game/example",
  "?tag=nsfw",
  prod,
);
assert.deepEqual(catalogOnAdmin, {
  location: "https://www.nsfwdroid.com/game/example?tag=nsfw",
  status: 307,
});

const local = resolveAdminHostLocations({
  NEXT_PUBLIC_SITE_URL: "http://localhost:3847",
});
assert.equal(local.adminBase, "http://admin.localhost:3847");
assert.deepEqual(hostRedirectForRequest("localhost:3847", "/admin", "", local), {
  location: "http://admin.localhost:3847/admin",
  status: 308,
});
assert.equal(hostRedirectForRequest("admin.localhost:3847", "/admin/login", "", local), null);

const overridden = resolveAdminHostLocations({
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3847",
  ADMIN_HOST: "admin.localhost",
});
assert.equal(overridden.adminHost, "admin.localhost:3847");
assert.equal(
  hostRedirectForRequest("127.0.0.1:3847", "/api/admin/logout", "", overridden)?.location,
  "http://admin.localhost:3847/api/admin/logout",
);

assert.equal(isAdminAppPath("/admin"), true);
assert.equal(isAdminAppPath("/administrator"), false);
assert.equal(isAdminAppPath("/api/admin/login"), true);

const cookie = adminCookieOptions();
assert.equal(Object.prototype.hasOwnProperty.call(cookie, "domain"), false);
assert.equal(cookie.httpOnly, true);
assert.equal(cookie.path, "/");
assert.equal(cookie.sameSite, "lax");

assert.equal(cloudflareAccessConfig({}), null);
assert.equal(cloudflareAccessConfig({ CF_ACCESS_AUD: "aud-only" }), null);
assert.equal(normalizeAccessTeamHost("not a host"), null);
assert.equal(
  normalizeAccessTeamHost("https://Team.cloudflareaccess.com/cdn-cgi/access/certs"),
  "team.cloudflareaccess.com",
);

const access = cloudflareAccessConfig({
  CF_ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com/",
  CF_ACCESS_AUD: "test-aud",
});
assert.ok(access);
assert.equal(access.issuer, "https://team.cloudflareaccess.com");
assert.equal(access.certsUrl, "https://team.cloudflareaccess.com/cdn-cgi/access/certs");
assert.equal(access.audience, "test-aud");

assert.equal(readCfAccessJwt(" header-token ", "cookie-token"), "header-token");
assert.equal(readCfAccessJwt("  ", "cookie-token"), "cookie-token");
assert.equal(readCfAccessJwt(null, null), null);

async function assertJwtGate() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  async function sign(claims: { aud?: string; iss?: string; exp?: string | number }) {
    return new SignJWT({})
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(claims.iss ?? access!.issuer)
      .setAudience(claims.aud ?? access!.audience)
      .setIssuedAt()
      .setExpirationTime(claims.exp ?? "10m")
      .sign(privateKey);
  }

  assert.equal(await verifyCfAccessJwt(await sign({}), access!, publicKey), true);
  assert.equal(await verifyCfAccessJwt(await sign({ aud: "other" }), access!, publicKey), false);
  assert.equal(
    await verifyCfAccessJwt(await sign({ iss: "https://evil.example" }), access!, publicKey),
    false,
  );
  assert.equal(await verifyCfAccessJwt(await sign({ exp: "-1m" }), access!, publicKey), false);
  assert.equal(await verifyCfAccessJwt("", access!, publicKey), false);
}

assertJwtGate().then(
  () => console.log("test-admin-host: ok"),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
