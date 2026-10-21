import { fetchSafeOutboundUrl } from "@/lib/outbound-fetch";
import { siteUrl } from "@/lib/site";
import { formatMastodonStatus, type SocialPostPayload } from "@/lib/social/compose";
import { resolveListingCoverUrl } from "@/lib/social/cover-url";
import { mastodonVisibility } from "@/lib/social/config";

const COVER_FETCH_TIMEOUT_MS = 30_000;
const COVER_MAX_BYTES = 8 * 1024 * 1024;

function coverFetchUserAgent(): string {
  const base = siteUrl.replace(/\/$/, "");
  return `NSFWDroid-Social/1.0 (+${base})`;
}

function filenameForCover(contentType: string | null): string {
  const mime = (contentType ?? "").toLowerCase();
  if (mime.includes("png")) return "cover.png";
  if (mime.includes("webp")) return "cover.webp";
  if (mime.includes("gif")) return "cover.gif";
  return "cover.jpg";
}

function instanceBase(): string {
  const raw = process.env.MASTODON_INSTANCE_URL?.trim().replace(/\/$/, "");
  if (!raw) throw new Error("MASTODON_INSTANCE_URL is not set");
  return raw;
}

function accessToken(): string {
  const token = process.env.MASTODON_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("MASTODON_ACCESS_TOKEN is not set");
  return token;
}

async function mastodonFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${instanceBase()}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken()}`);
  return fetch(url, { ...init, headers });
}

export async function uploadMastodonMedia(
  imageUrl: string,
  description?: string,
): Promise<string> {
  const resolved = resolveListingCoverUrl(imageUrl) ?? imageUrl;
  const imageRes = await fetchSafeOutboundUrl(resolved, {
    headers: { "User-Agent": coverFetchUserAgent(), Accept: "image/*,*/*;q=0.8" },
    signal: AbortSignal.timeout(COVER_FETCH_TIMEOUT_MS),
  });
  if (!imageRes.ok) {
    throw new Error(`cover_fetch_failed:${imageRes.status}`);
  }
  const buf = Buffer.from(await imageRes.arrayBuffer());
  if (buf.length > COVER_MAX_BYTES) {
    throw new Error(`cover_too_large:${buf.length}`);
  }
  const blob = new Blob([buf], {
    type: imageRes.headers.get("content-type") ?? "image/jpeg",
  });
  const form = new FormData();
  form.append("file", blob, filenameForCover(imageRes.headers.get("content-type")));
  if (description) form.append("description", description.slice(0, 420));

  const res = await mastodonFetch("/api/v1/media", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`mastodon_media_${res.status}:${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { id?: string };
  if (!json.id) throw new Error("mastodon_media_missing_id");
  return json.id;
}

export type MastodonPostResult = {
  id: string;
  url: string | null;
};

export async function postMastodonStatus(
  payload: SocialPostPayload,
  options?: { attachCover?: boolean; dryRun?: boolean },
): Promise<MastodonPostResult> {
  const status = formatMastodonStatus(payload);
  if (options?.dryRun) {
    return { id: "dry-run", url: null };
  }

  const mediaIds: string[] = [];
  const coverUrl = resolveListingCoverUrl(payload.coverImageUrl);
  if (options?.attachCover && coverUrl) {
    try {
      const mediaId = await uploadMastodonMedia(
        coverUrl,
        `${payload.title} cover`,
      );
      mediaIds.push(mediaId);
    } catch (err) {
      console.warn(
        JSON.stringify({
          warn: "mastodon_cover_skipped",
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }

  const body: Record<string, unknown> = {
    status,
    visibility: mastodonVisibility(),
    sensitive: mediaIds.length > 0,
  };
  if (mediaIds.length) body.media_ids = mediaIds;

  const res = await mastodonFetch("/api/v1/statuses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mastodon_status_${res.status}:${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as { id?: string; url?: string };
  if (!json.id) throw new Error("mastodon_status_missing_id");
  return { id: String(json.id), url: json.url ?? null };
}
