import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

/**
 * Cloudflare Access JWT check.
 *
 * Standard approach (Cloudflare “Validating JSON” for Access):
 * https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
 *
 * 1. Read `Cf-Access-Jwt-Assertion` (cookie `CF_Authorization` is the same token if the header was stripped).
 * 2. Fetch signing keys from `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs` (JWKS).
 * 3. Verify RS256 signature, `exp`, `iss` = `https://<team>.cloudflareaccess.com`, and `aud` = the application's AUD tag.
 * 4. Require the `email` claim to be the owner address (`ADMIN_ACCESS_EMAIL`), compared case-insensitively.
 *
 * Both `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` must be set. If either is missing, Access is off
 * and the existing admin password still gates `/admin` (so a deploy cannot lock the owner out).
 */

/** Cloudflare Access policy Include → Emails. The verified JWT must carry this address. */
export const ADMIN_ACCESS_EMAIL = "donavansky@gmail.com";

/**
 * Case-insensitive match for the Access `email` claim.
 * Empty, missing, and any other address are rejected.
 */
export function cfAccessEmailAllowed(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 && normalized === ADMIN_ACCESS_EMAIL;
}

export type CloudflareAccessConfig = {
  teamHost: string;
  issuer: string;
  certsUrl: string;
  audience: string;
};

type AccessEnv = {
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
};

const jwksByUrl = new Map<string, JWTVerifyGetKey>();
let warnedPartial = false;

export function normalizeAccessTeamHost(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProto);
    const host = url.hostname.toLowerCase();
    if (!host || !host.endsWith(".cloudflareaccess.com")) return null;
    return host;
  } catch {
    return null;
  }
}

export function cloudflareAccessConfig(env?: AccessEnv): CloudflareAccessConfig | null {
  const source = env ?? {
    CF_ACCESS_AUD: process.env.CF_ACCESS_AUD,
    CF_ACCESS_TEAM_DOMAIN: process.env.CF_ACCESS_TEAM_DOMAIN,
  };
  const audience = source.CF_ACCESS_AUD?.trim() ?? "";
  const teamRaw = source.CF_ACCESS_TEAM_DOMAIN?.trim() ?? "";
  if (!audience || !teamRaw) {
    if ((audience && !teamRaw) || (!audience && teamRaw)) {
      if (!warnedPartial) {
        warnedPartial = true;
        console.error(
          "Cloudflare Access is incomplete: set both CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD, or neither.",
        );
      }
    }
    return null;
  }
  const teamHost = normalizeAccessTeamHost(teamRaw);
  if (!teamHost) {
    if (!warnedPartial) {
      warnedPartial = true;
      console.error(
        "CF_ACCESS_TEAM_DOMAIN must be the team host <team>.cloudflareaccess.com (Access JWT check is off).",
      );
    }
    return null;
  }
  return {
    teamHost,
    issuer: `https://${teamHost}`,
    certsUrl: `https://${teamHost}/cdn-cgi/access/certs`,
    audience,
  };
}

export function readCfAccessJwt(
  headerValue: string | null | undefined,
  cookieValue: string | null | undefined,
): string | null {
  const header = headerValue?.trim();
  if (header) return header;
  const cookie = cookieValue?.trim();
  return cookie || null;
}

function jwksFor(certsUrl: string): JWTVerifyGetKey {
  let existing = jwksByUrl.get(certsUrl);
  if (!existing) {
    existing = createRemoteJWKSet(new URL(certsUrl));
    jwksByUrl.set(certsUrl, existing);
  }
  return existing;
}

export async function verifyCfAccessJwt(
  token: string,
  config: CloudflareAccessConfig,
  key?: JWTVerifyGetKey | CryptoKey,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key ?? jwksFor(config.certsUrl), {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ["RS256"],
    });
    return cfAccessEmailAllowed(payload.email);
  } catch {
    return false;
  }
}
