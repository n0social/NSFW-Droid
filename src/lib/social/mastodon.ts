import { formatMastodonStatus, type SocialPostPayload } from "@/lib/social/compose";
import { mastodonVisibility } from "@/lib/social/config";

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
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    throw new Error(`cover_fetch_failed:${imageRes.status}`);
  }
  const blob = await imageRes.blob();
  const form = new FormData();
  form.append("file", blob, "cover.jpg");
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
  if (options?.attachCover && payload.coverImageUrl) {
    try {
      const mediaId = await uploadMastodonMedia(
        payload.coverImageUrl,
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
