/**
 * Update the Mastodon profile for the token in env (production: @nsfwdroid@mastodon.social).
 *
 * Uploads avatar/header via POST /api/v2/media (connectivity + alt-text check), then
 * PATCH /api/v1/accounts/update_credentials with the image files. Media IDs cannot
 * set avatar/header — the PATCH still needs the files.
 *
 * Requires scopes: write:media (upload) and write:accounts (credentials).
 * Never print or commit MASTODON_ACCESS_TOKEN.
 *
 * Usage:
 *   set -a && source /etc/nsfwdroid.env && set +a
 *   npx tsx scripts/mastodon-update-profile.ts \
 *     --avatar=/path/mastodon-avatar-vesper.png \
 *     --header=/path/mastodon-banner-vesper-bunny.png
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { basename } from "node:path";

export const DEFAULT_DISPLAY_NAME = "NSFW Droid";
export const DEFAULT_WEBSITE = "https://www.nsfwdroid.com";
export const DEFAULT_NOTE = [
  "Top NSFW mobile & web games listing. Follow for new catalog drops. Sign up for the weekly newsletter on the site. 18+ only. Hosted by Vesper.",
  "",
  DEFAULT_WEBSITE,
].join("\n");

const AVATAR_ALT =
  "Vesper, NSFW Droid mascot: close-up of an adult woman with long black hair, a magenta-pink streak, violet eyes, and glasses.";
const HEADER_ALT =
  "NSFW Droid banner: Vesper in a cute pink bunny outfit. Top NSFW mobile and web games listing. Sign up for the weekly newsletter. 18+.";

if (DEFAULT_NOTE.length > 500) {
  throw new Error(`DEFAULT_NOTE is ${DEFAULT_NOTE.length} chars (Mastodon limit 500)`);
}

function argValue(name: string): string | undefined {
  const prefixed = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (prefixed) return prefixed.slice(name.length + 3);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0) return process.argv[idx + 1];
  return undefined;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function instanceBase(): string {
  const raw = process.env.MASTODON_INSTANCE_URL?.trim().replace(/\/$/, "");
  if (!raw) throw new Error("Set MASTODON_INSTANCE_URL");
  return raw;
}

function accessToken(): string {
  const token = process.env.MASTODON_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("Set MASTODON_ACCESS_TOKEN");
  return token;
}

function filePart(path: string): File {
  const buf = readFileSync(path);
  return new File([buf], basename(path), { type: "image/png" });
}

async function mastodonFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken()}`);
  return fetch(`${instanceBase()}${path}`, { ...init, headers });
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

type MediaUpload = { id: string; url: string | null; preview_url?: string | null };

async function uploadMediaV2(path: string, description: string): Promise<MediaUpload> {
  const form = new FormData();
  form.append("file", filePart(path));
  form.append("description", description.slice(0, 1500));
  const res = await mastodonFetch("/api/v2/media", { method: "POST", body: form });
  const text = await res.text();
  if (!res.ok && res.status !== 202) {
    throw new Error(`media_v2_${res.status}:${text.slice(0, 300)}`);
  }
  let json = JSON.parse(text) as MediaUpload;
  if (!json.id) throw new Error("media_v2_missing_id");
  for (let i = 0; i < 12 && !json.url; i++) {
    await sleep(500);
    const poll = await mastodonFetch(`/api/v1/media/${json.id}`);
    const body = await poll.text();
    if (!poll.ok) throw new Error(`media_poll_${poll.status}:${body.slice(0, 200)}`);
    json = JSON.parse(body) as MediaUpload;
  }
  return json;
}

type CredentialAccount = {
  acct?: string;
  id?: string;
  display_name?: string;
  note?: string;
  bot?: boolean;
  avatar?: string;
  header?: string;
  fields?: { name?: string; value?: string }[];
  source?: { note?: string; fields?: { name?: string; value?: string }[] };
};

async function verifyCredentials(): Promise<CredentialAccount> {
  const res = await mastodonFetch("/api/v1/accounts/verify_credentials");
  const text = await res.text();
  if (!res.ok) throw new Error(`verify_${res.status}:${text.slice(0, 300)}`);
  return JSON.parse(text) as CredentialAccount;
}

function summarize(acct: CredentialAccount) {
  const fields = (acct.source?.fields ?? acct.fields ?? []).map((f) => ({
    name: f.name,
    value: f.value?.replace(/<[^>]+>/g, "") ?? "",
  }));
  return {
    ok: true,
    acct: acct.acct,
    id: acct.id,
    display_name: acct.display_name,
    bot: acct.bot,
    note: acct.source?.note ?? acct.note,
    fields,
    avatar: acct.avatar,
    header: acct.header,
  };
}

async function updateCredentials(input: {
  avatarPath: string;
  headerPath: string;
  displayName: string;
  note: string;
  website: string;
}): Promise<CredentialAccount> {
  const form = new FormData();
  form.append("display_name", input.displayName);
  form.append("note", input.note);
  form.append("bot", "false");
  form.append("avatar", filePart(input.avatarPath));
  form.append("avatar_description", AVATAR_ALT);
  form.append("header", filePart(input.headerPath));
  form.append("header_description", HEADER_ALT);
  form.append("fields_attributes[0][name]", "Website");
  form.append("fields_attributes[0][value]", input.website);
  const res = await mastodonFetch("/api/v1/accounts/update_credentials", {
    method: "PATCH",
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    const hint =
      res.status === 403
        ? " Token needs write:accounts — re-run scripts/mastodon-oauth-token.ts authorize/exchange and replace MASTODON_ACCESS_TOKEN."
        : "";
    throw new Error(`update_credentials_${res.status}:${text.slice(0, 400)}${hint}`);
  }
  return JSON.parse(text) as CredentialAccount;
}

async function main() {
  const avatarPath = argValue("avatar");
  const headerPath = argValue("header");
  if (!avatarPath || !headerPath) {
    throw new Error(
      "Usage: npx tsx scripts/mastodon-update-profile.ts --avatar=AVATAR.png --header=HEADER.png",
    );
  }
  const displayName = argValue("display-name") ?? DEFAULT_DISPLAY_NAME;
  const note = argValue("note") ?? DEFAULT_NOTE;
  const website = argValue("website") ?? DEFAULT_WEBSITE;
  if (note.length > 500) {
    throw new Error(`note is ${note.length} chars (Mastodon limit 500)`);
  }

  if (flag("dry-run")) {
    console.log(
      JSON.stringify({
        ok: true,
        dry_run: true,
        display_name: displayName,
        note,
        note_len: note.length,
        website,
        bot: false,
        avatar: avatarPath,
        header: headerPath,
      }),
    );
    return;
  }

  const avatarMedia = await uploadMediaV2(avatarPath, AVATAR_ALT);
  const headerMedia = await uploadMediaV2(headerPath, HEADER_ALT);
  const updated = await updateCredentials({
    avatarPath,
    headerPath,
    displayName,
    note,
    website,
  });
  const verified = await verifyCredentials();
  console.log(
    JSON.stringify({
      ...summarize(verified),
      media_preupload: {
        avatar_id: avatarMedia.id,
        header_id: headerMedia.id,
      },
      updated_acct: updated.acct,
    }),
  );
}

if (process.argv[1] && /mastodon-update-profile/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
