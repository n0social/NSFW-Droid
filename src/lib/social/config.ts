export type SocialPlatform = "mastodon" | "pillowfort";

function parseEnvBool(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined || value === "") return defaultValue;
  const v = value.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  return defaultValue;
}

export function isSocialEnqueueEnabled(): boolean {
  if (parseEnvBool(process.env.SOCIAL_ENQUEUE_ENABLED, false)) return true;
  if (isMastodonSocialEnabled()) return true;
  if (isPillowfortSocialEnabled()) return true;
  return parseEnvBool(process.env.SOCIAL_MASTODON_ENQUEUE, false);
}

export function isMastodonSocialEnabled(): boolean {
  return (
    parseEnvBool(process.env.SOCIAL_MASTODON_ENABLED, false) &&
    Boolean(process.env.MASTODON_INSTANCE_URL?.trim()) &&
    Boolean(process.env.MASTODON_ACCESS_TOKEN?.trim())
  );
}

export function isPillowfortSocialEnabled(): boolean {
  return parseEnvBool(process.env.PILLOWFORT_ENABLED, false);
}

export function socialMaxPerIngest(): number {
  const n = Number(process.env.SOCIAL_MAX_PER_INGEST ?? "3");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
}

export function socialMaxPerDay(): number {
  const n = Number(process.env.SOCIAL_MAX_PER_DAY ?? "15");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 15;
}

export function socialDrainLimitPerRun(): number {
  const n = Number(process.env.SOCIAL_DRAIN_LIMIT ?? "10");
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 10;
}

/** Only consider listings first seen within this window (hours). */
export function socialEnqueueWindowHours(): number {
  const n = Number(process.env.SOCIAL_ENQUEUE_WINDOW_HOURS ?? "72");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 72;
}

export function isSocialDryRun(): boolean {
  return parseEnvBool(process.env.SOCIAL_DRY_RUN, false);
}

/** Attach listing cover image to Mastodon posts (same URL as on-site cards). Set to 0 to disable. */
export function mastodonAttachCover(): boolean {
  return parseEnvBool(process.env.MASTODON_ATTACH_COVER, true);
}

export function mastodonVisibility(): "public" | "unlisted" | "private" | "direct" {
  const v = (process.env.MASTODON_VISIBILITY ?? "public").trim().toLowerCase();
  if (v === "unlisted" || v === "private" || v === "direct") return v;
  return "public";
}

export function activeSocialPlatforms(): SocialPlatform[] {
  const platforms: SocialPlatform[] = [];
  const enqueueMastodon =
    isMastodonSocialEnabled() ||
    parseEnvBool(process.env.SOCIAL_MASTODON_ENQUEUE, false) ||
    parseEnvBool(process.env.SOCIAL_ENQUEUE_ENABLED, false);
  if (enqueueMastodon) platforms.push("mastodon");
  if (isPillowfortSocialEnabled()) platforms.push("pillowfort");
  return platforms;
}
