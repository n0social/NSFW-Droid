/**
 * Mastodon user access token (OAuth2 authorization code + oob redirect).
 * Never put account passwords in env — only client id/secret and the one-time code.
 *
 * Usage:
 *   MASTODON_INSTANCE_URL=https://mastodon.social \
 *   MASTODON_CLIENT_ID=... MASTODON_CLIENT_SECRET=... \
 *   npx tsx scripts/mastodon-oauth-token.ts authorize
 *
 *   ... log in, approve app, copy code from page ...
 *
 *   MASTODON_INSTANCE_URL=... MASTODON_CLIENT_ID=... MASTODON_CLIENT_SECRET=... \
 *   npx tsx scripts/mastodon-oauth-token.ts exchange --code=YOUR_CODE
 */
import "dotenv/config";

const SCOPES = "read write:statuses write:media";
const REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";

function baseUrl(): string {
  const raw = process.env.MASTODON_INSTANCE_URL?.trim().replace(/\/$/, "");
  if (!raw) throw new Error("Set MASTODON_INSTANCE_URL (e.g. https://mastodon.social)");
  return raw;
}

function clientId(): string {
  const id = process.env.MASTODON_CLIENT_ID?.trim();
  if (!id) throw new Error("Set MASTODON_CLIENT_ID from Preferences → Development → your app");
  return id;
}

function clientSecret(): string {
  const s = process.env.MASTODON_CLIENT_SECRET?.trim();
  if (!s) throw new Error("Set MASTODON_CLIENT_SECRET from the same app page");
  return s;
}

function authorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
  });
  return `${baseUrl()}/oauth/authorize?${params.toString()}`;
}

async function exchangeCode(code: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: REDIRECT_URI,
      code: code.trim(),
      scope: SCOPES,
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`token_exchange_${res.status}:${body.slice(0, 400)}`);
  }
  const json = JSON.parse(body) as { access_token?: string; token_type?: string; scope?: string };
  if (!json.access_token) throw new Error("missing access_token in response");
  console.log(
    JSON.stringify({
      ok: true,
      token_type: json.token_type,
      scope: json.scope,
      access_token: json.access_token,
      hint: "Add to /etc/nsfwdroid.env as MASTODON_ACCESS_TOKEN (do not commit).",
    }),
  );
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "authorize") {
    console.log(authorizeUrl());
    return;
  }
  if (cmd === "exchange") {
    const codeArg = process.argv.find((a) => a.startsWith("--code="));
    const code = codeArg?.slice("--code=".length) ?? process.argv[3];
    if (!code) throw new Error("Usage: exchange --code=AUTHORIZATION_CODE");
    await exchangeCode(code);
    return;
  }
  throw new Error("Usage: authorize | exchange --code=...");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
