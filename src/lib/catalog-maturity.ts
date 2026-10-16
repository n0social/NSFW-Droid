import type { Candidate } from "@/db/schema";

/** Adult tag slugs we attach from feeds, keywords, or Steam descriptors. */
export const MATURE_TAG_SLUGS = new Set([
  "nsfw",
  "adult",
  "erotic",
  "lewd",
  "hentai",
  "18-plus",
  "adult-only-sexual",
  "sexual-content",
  "porn",
  "xxx",
  "nude",
  "mature",
]);

/** itch browse paths that are explicitly adult-tagged (not general VN/dating browses). */
export const ITCH_ADULT_FEED_PATH_MARKERS = [
  "/tag-nsfw",
  "/tag-adult",
  "/tag-erotic",
  "/tag-lewd",
  "/tag-hentai",
];

const MATURE_TEXT_RE =
  /\b(nsfw|18\+|adult only|adult game|erotic|lewd|hentai|porn|xxx|nude|nudity|sexual content|mature content|ecchi)\b/i;

const STEAM_DESCRIPTOR_ADULT_ONLY_SEXUAL = 3;
const STEAM_DESCRIPTOR_SEXUAL = 1;

function parseEnvBool(value: string | undefined): boolean | undefined {
  if (value === undefined || value === "") return undefined;
  const v = value.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  return undefined;
}

/** Default on: itch ingest uses NSFW browse feeds only (no global new/featured/sales). */
export function isItchNsfwOnlyMode(): boolean {
  const v = parseEnvBool(process.env.ITCH_NSFW_ONLY);
  return v !== false;
}

/** Default on: auto-publish requires mature signals per source (itch/steam). */
export function isCatalogNsfwEnforcementEnabled(): boolean {
  const v = parseEnvBool(process.env.CATALOG_NSFW_ONLY);
  return v !== false;
}

export function itchFeedIsExplicitAdultBrowse(feedUrl: string): boolean {
  const lower = feedUrl.toLowerCase();
  return ITCH_ADULT_FEED_PATH_MARKERS.some((m) => lower.includes(m));
}

export function textHasMatureKeyword(text: string): boolean {
  return MATURE_TEXT_RE.test(text);
}

export function matureTagSlugsFromList(slugs: string[]): boolean {
  return slugs.some((s) => MATURE_TAG_SLUGS.has(s));
}

type ItchItemLike = Record<string, unknown>;

export function isMatureItchItem(
  item: ItchItemLike,
  feedUrl: string,
  extractedTagSlugs: string[] = [],
): boolean {
  if (itchFeedIsExplicitAdultBrowse(feedUrl)) return true;
  if (matureTagSlugsFromList(extractedTagSlugs)) return true;

  const title = String(item.title ?? item.plainTitle ?? "");
  const desc = String(item.description ?? "");
  return textHasMatureKeyword(`${title} ${desc}`);
}

type SteamPayload = {
  content_descriptors?: { ids?: number[] };
};

export function isMatureSteamPayload(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const steam = (raw as { steam?: SteamPayload }).steam ?? (raw as SteamPayload);
  const ids = steam?.content_descriptors?.ids ?? [];
  if (ids.includes(STEAM_DESCRIPTOR_ADULT_ONLY_SEXUAL)) return true;
  const sexualOff = process.env.STEAM_INCLUDE_SEXUAL_DESCRIPTOR?.trim().toLowerCase();
  const includeSexual = sexualOff !== "0" && sexualOff !== "false" && sexualOff !== "no";
  if (includeSexual && ids.includes(STEAM_DESCRIPTOR_SEXUAL)) {
    return true;
  }
  return false;
}

export function isMatureCatalogCandidate(
  c: Pick<Candidate, "source" | "title" | "rawPayload">,
  tagSlugs: string[] = [],
): boolean {
  if (c.source === "manual" || c.source === "developer_form" || c.source === "affiliate_export") {
    return true;
  }

  if (c.source === "steam") {
    return isMatureSteamPayload(c.rawPayload);
  }

  if (c.source === "itch") {
    const raw = c.rawPayload as ItchItemLike | null;
    const feedUrl = String(raw?.feedUrl ?? "");
    if (raw && feedUrl) {
      return isMatureItchItem(raw, feedUrl, tagSlugs);
    }
    return matureTagSlugsFromList(tagSlugs) || textHasMatureKeyword(c.title);
  }

  return matureTagSlugsFromList(tagSlugs) || textHasMatureKeyword(c.title);
}
