import { siteUrl } from "@/lib/site";

export type SocialPostPayload = {
  title: string;
  slug: string;
  url: string;
  coverImageUrl: string | null;
  affiliateUrl: string | null;
};

export function listingGameUrl(slug: string): string {
  return `${siteUrl}/game/${slug}`;
}

export function buildSocialPostPayload(input: {
  title: string;
  slug: string;
  coverImageUrl: string | null;
  affiliateUrl: string | null;
}): SocialPostPayload {
  return {
    title: input.title.trim(),
    slug: input.slug,
    url: listingGameUrl(input.slug),
    coverImageUrl: input.coverImageUrl?.trim() || null,
    affiliateUrl: input.affiliateUrl?.trim() || null,
  };
}

/** Mastodon status text (500 char limit on many instances; keep concise). */
export function formatMastodonStatus(payload: SocialPostPayload): string {
  const lines: string[] = [payload.title, "", payload.url];
  if (payload.affiliateUrl) {
    lines.push("", "Affiliate link on our catalog page.");
  }
  const tags = pickHashtags(payload.title);
  if (tags.length) {
    lines.push("", tags.join(" "));
  }
  let text = lines.join("\n");
  if (text.length > 480) {
    const shortTitle =
      payload.title.length > 120 ? `${payload.title.slice(0, 117)}…` : payload.title;
    text = [shortTitle, "", payload.url, tags.length ? `\n${tags.join(" ")}` : ""]
      .filter(Boolean)
      .join("\n");
  }
  return text;
}

const HASHTAG_RULES: { pattern: RegExp; tag: string }[] = [
  { pattern: /\bvisual\s*novel\b/i, tag: "#visualnovel" },
  { pattern: /\brpg\b/i, tag: "#nsfwrpg" },
  { pattern: /\byuri\b/i, tag: "#yuri" },
  { pattern: /\byaoi\b/i, tag: "#yaoi" },
  { pattern: /\bfurry\b/i, tag: "#furry" },
];

function pickHashtags(title: string): string[] {
  const tags = new Set<string>(["#nsfwgames"]);
  for (const rule of HASHTAG_RULES) {
    if (rule.pattern.test(title)) tags.add(rule.tag);
  }
  return [...tags];
}

/** Same copy for manual Pillowfort posts until an API adapter exists. */
export function formatPillowfortBody(payload: SocialPostPayload): string {
  return formatMastodonStatus(payload);
}
