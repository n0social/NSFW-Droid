import { readFile } from "fs/promises";
import { parseStoreTarget } from "../../src/lib/outbound-link";

export type ItchManualGameSeed = {
  title: string;
  officialUrl: string;
  feedUrl?: string;
  matchSlug?: string;
  externalId?: string;
  notes?: string;
};

export async function loadItchManualGameSeeds(): Promise<ItchManualGameSeed[]> {
  const env = process.env.ITCH_MANUAL_GAME_URLS_PATH?.trim();
  const path = env || "data/itch-manual-game-urls.json";
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as ItchManualGameSeed[];
    return Array.isArray(parsed) ? parsed.filter((r) => r?.title && r?.officialUrl) : [];
  } catch {
    return [];
  }
}

export function itchManualExternalId(seed: ItchManualGameSeed): string {
  if (seed.externalId?.trim()) return seed.externalId.trim();
  const slug = seed.matchSlug?.trim() || slugFromItchUrl(seed.officialUrl);
  return slug ? `manual:${slug}` : `manual:${seed.title.toLowerCase().replace(/\s+/g, "-")}`;
}

export function slugFromItchUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  } catch {
    return "";
  }
}

export function feedItemMatchesSeed(
  itemLink: string,
  seed: ItchManualGameSeed,
): boolean {
  const link = itemLink.trim();
  const official = seed.officialUrl.trim();
  if (!link || !official) return false;

  const linkLower = link.toLowerCase();
  const officialLower = official.toLowerCase();
  if (linkLower === officialLower || linkLower.startsWith(`${officialLower}/`)) {
    return true;
  }

  const seedTarget = parseStoreTarget(official);
  const itemTarget = parseStoreTarget(link);
  if (
    seedTarget?.kind === "itch" &&
    itemTarget?.kind === "itch" &&
    seedTarget.key === itemTarget.key
  ) {
    return true;
  }

  const slug = (seed.matchSlug || slugFromItchUrl(seed.officialUrl)).toLowerCase();
  if (!slug) return false;

  try {
    const u = new URL(link);
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1]?.toLowerCase();
    return last === slug;
  } catch {
    return false;
  }
}
