import { readFileSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import type { Candidate, Listing } from "@/db/schema";
import { parseStoreTarget } from "@/lib/outbound-link";

export type CoverOptionalEntry = {
  slug?: string;
  officialUrl?: string;
  note?: string;
};

const DATA_PATH = path.join(process.cwd(), "data/cover-optional-listings.json");

let cached: CoverOptionalEntry[] | null = null;

function parseEntries(raw: string): CoverOptionalEntry[] {
  return JSON.parse(raw) as CoverOptionalEntry[];
}

export function getCoverOptionalListingsSync(): CoverOptionalEntry[] {
  if (cached) return cached;
  try {
    cached = parseEntries(readFileSync(DATA_PATH, "utf8"));
  } catch {
    cached = [];
  }
  return cached;
}

export async function loadCoverOptionalListings(): Promise<CoverOptionalEntry[]> {
  return getCoverOptionalListingsSync();
}

/** Sync helper when async file read is awkward (SQL builders at module init). */
export function coverOptionalListingSlugs(entries: CoverOptionalEntry[]): string[] {
  return entries
    .map((e) => e.slug?.trim())
    .filter((s): s is string => Boolean(s));
}

export function coverOptionalOfficialUrls(entries: CoverOptionalEntry[]): string[] {
  return entries
    .map((e) => e.officialUrl?.trim())
    .filter((u): u is string => Boolean(u));
}

function urlKeys(url: string | null | undefined): string[] {
  const raw = url?.trim();
  if (!raw) return [];
  const keys = new Set<string>();
  keys.add(raw.toLowerCase());
  try {
    const u = new URL(raw);
    keys.add(`${u.protocol}//${u.host}${u.pathname}`.toLowerCase().replace(/\/$/, ""));
  } catch {
    /* ignore */
  }
  const target = parseStoreTarget(raw);
  if (target?.kind === "itch") keys.add(target.key);
  return [...keys];
}

function entryKeys(entry: CoverOptionalEntry): string[] {
  const keys = new Set<string>();
  for (const u of urlKeys(entry.officialUrl)) keys.add(u);
  const slug = entry.slug?.trim().toLowerCase();
  if (slug) keys.add(`slug:${slug}`);
  return [...keys];
}

function matchesEntry(
  entry: CoverOptionalEntry,
  input: { slug?: string | null; outboundUrl?: string | null; externalId?: string | null },
): boolean {
  const slug = input.slug?.trim().toLowerCase();
  if (slug && entry.slug?.trim().toLowerCase() === slug) return true;

  const candidateKeys = new Set<string>();
  for (const u of urlKeys(input.outboundUrl)) candidateKeys.add(u);
  for (const u of urlKeys(input.externalId)) candidateKeys.add(u);
  if (slug) candidateKeys.add(`slug:${slug}`);

  const wanted = entryKeys(entry);
  return wanted.some((k) => candidateKeys.has(k));
}

export function listingMatchesCoverOptionalOverride(
  listing: Pick<Listing, "slug" | "officialUrl" | "externalId">,
  entries: CoverOptionalEntry[],
): boolean {
  return entries.some((e) =>
    matchesEntry(e, {
      slug: listing.slug,
      outboundUrl: listing.officialUrl,
      externalId: listing.externalId,
    }),
  );
}

export function candidateMatchesCoverOptionalOverride(
  candidate: Pick<Candidate, "outboundUrl" | "externalId">,
  entries: CoverOptionalEntry[],
): boolean {
  return entries.some((e) =>
    matchesEntry(e, { outboundUrl: candidate.outboundUrl, externalId: candidate.externalId }),
  );
}
