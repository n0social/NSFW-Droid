import type { Candidate, Listing } from "@/db/schema";

const ALLOWED_COVER_HOSTS = new Set([
  "cdn.akamai.steamstatic.com",
  "shared.akamai.steamstatic.com",
  "steamcdn-a.akamaihd.net",
  "img.itch.zone",
  "static.itch.io",
]);

function isAllowedCoverUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return ALLOWED_COVER_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

function pickUrl(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    const url = value.trim();
    return isAllowedCoverUrl(url) ? url : null;
  }
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    for (const key of ["url", "#text", "_url", "@_url"]) {
      const nested = pickUrl(o[key]);
      if (nested) return nested;
    }
  }
  return null;
}

function steamHeaderFromAppId(appId: unknown): string | null {
  const id = typeof appId === "number" ? appId : Number(appId);
  if (!Number.isFinite(id) || id <= 0) return null;
  const url = `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`;
  return isAllowedCoverUrl(url) ? url : null;
}

/** Extract an allowlisted cover URL from ingest raw_payload (Steam / itch RSS). */
export function extractCoverImageUrl(
  source: Listing["source"] | Candidate["source"],
  rawPayload: unknown,
): string | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;
  const raw = rawPayload as Record<string, unknown>;

  if (source === "steam") {
    const steam = raw.steam as { header_image?: string; steam_appid?: number } | undefined;
    const fromApi = pickUrl(steam?.header_image);
    if (fromApi) return fromApi;
    return steamHeaderFromAppId(raw.appId ?? steam?.steam_appid);
  }

  if (source === "itch") {
    for (const key of [
      "imageurl",
      "imageUrl",
      "coverImage",
      "image",
      "media:thumbnail",
      "mediaThumbnail",
      "thumbnail",
    ]) {
      const url = pickUrl(raw[key]);
      if (url) return url;
    }
  }

  return null;
}

export function artworkSourceForCover(coverUrl: string | null): Listing["artworkSource"] {
  return coverUrl ? "store_capsule" : "typographic";
}
