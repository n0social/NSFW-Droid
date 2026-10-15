import type { UserPreferences } from "@/db/schema";

/** Persisted browse filters — only stored on `user_profile` for signed-in users. */
export type BrowseSavedPrefs = {
  rail?: "hot" | "trending" | null;
  tag?: string | null;
  q?: string | null;
  vanilla?: boolean;
};

export function parseBrowseSavedPrefs(raw: unknown): BrowseSavedPrefs | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const browse: BrowseSavedPrefs = {};
  if (o.rail === "hot" || o.rail === "trending") browse.rail = o.rail;
  else if (o.rail === null) browse.rail = null;
  if (typeof o.tag === "string" && o.tag.trim()) browse.tag = o.tag.trim();
  else if (o.tag === null) browse.tag = null;
  if (typeof o.q === "string") browse.q = o.q.trim() || null;
  if (typeof o.vanilla === "boolean") browse.vanilla = o.vanilla;
  return browseHasValues(browse) ? browse : undefined;
}

export function browseHasValues(browse: BrowseSavedPrefs): boolean {
  return Boolean(
    browse.vanilla ||
      (browse.tag && browse.tag.length > 0) ||
      (browse.q && browse.q.length > 0) ||
      browse.rail === "hot" ||
      browse.rail === "trending",
  );
}

export function browsePrefsFromSearchParams(input: {
  rail: string | null;
  tag: string | null;
  q: string | null;
  vanilla: boolean;
}): BrowseSavedPrefs | undefined {
  const browse: BrowseSavedPrefs = {};
  if (input.rail === "hot" || input.rail === "trending") browse.rail = input.rail;
  if (input.tag) browse.tag = input.tag;
  if (input.q) browse.q = input.q;
  if (input.vanilla) browse.vanilla = true;
  return browseHasValues(browse) ? browse : undefined;
}

export function browsePrefsToQueryString(browse: BrowseSavedPrefs): string {
  const params = new URLSearchParams();
  if (browse.vanilla) params.set("vanilla", "1");
  if (browse.tag) params.set("tag", browse.tag);
  if (browse.rail === "hot" || browse.rail === "trending") params.set("rail", browse.rail);
  if (browse.q) params.set("q", browse.q);
  return params.toString();
}

export function browsePrefsFromUserPreferences(
  prefs: UserPreferences | undefined,
): BrowseSavedPrefs | undefined {
  return prefs?.browse;
}
