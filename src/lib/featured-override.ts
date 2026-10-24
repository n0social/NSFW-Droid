import {
  catalogWeekTimeZone,
  startOfIsoWeekInTimeZone,
  zonedMidnightUtc,
} from "@/lib/catalog-week";

export function featuredListingSlugsFromEnv(): string[] {
  const raw = process.env.FEATURED_LISTING_SLUGS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Locked at first `auto` read after process start (restart/deploy sets the boundary). */
let cachedAutoEndsAt: Date | null = null;

/** @internal test hook */
export function resetFeaturedOverrideCacheForTests(): void {
  cachedAutoEndsAt = null;
}

/** Monday 00:00 ET at the end of the ISO week containing `now`. */
export function nextWeeklyFeaturedRotationAt(
  now: Date = new Date(),
  timeZone?: string,
): Date {
  const tz = timeZone ?? catalogWeekTimeZone();
  const thisWeekStart = startOfIsoWeekInTimeZone(now, tz);
  return new Date(thisWeekStart.getTime() + MS_PER_WEEK);
}

function autoOverrideEndsAt(now: Date): Date {
  if (!cachedAutoEndsAt) {
    cachedAutoEndsAt = nextWeeklyFeaturedRotationAt(now);
  }
  return cachedAutoEndsAt;
}

function parseYmdDate(raw: string): { year: number; month: number; day: number } | null {
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/**
 * When the env featured slug stops applying. `null` = no time-bounded override active.
 * - `FEATURED_LISTING_SLUGS_UNTIL=auto` → next Monday 00:00 in catalog week TZ
 * - `YYYY-MM-DD` → that calendar day 00:00 in catalog week TZ (override before that instant)
 * - unset with slugs set → permanent override (legacy)
 */
export function featuredListingOverrideEndsAt(now: Date = new Date()): Date | null {
  const slug = featuredListingSlugsFromEnv()[0];
  if (!slug) return null;

  const untilRaw = process.env.FEATURED_LISTING_SLUGS_UNTIL?.trim();
  if (!untilRaw) return null;

  const tz = catalogWeekTimeZone();
  if (untilRaw.toLowerCase() === "auto") {
    return autoOverrideEndsAt(now);
  }

  const ymd = parseYmdDate(untilRaw);
  if (ymd) {
    return zonedMidnightUtc(ymd, tz);
  }

  const parsed = Date.parse(untilRaw);
  if (Number.isFinite(parsed)) return new Date(parsed);

  return null;
}

export function featuredListingEnvOverrideActive(now: Date = new Date()): boolean {
  const slug = featuredListingSlugsFromEnv()[0];
  if (!slug) return false;

  const untilRaw = process.env.FEATURED_LISTING_SLUGS_UNTIL?.trim();
  if (!untilRaw) return true;

  const endsAt = featuredListingOverrideEndsAt(now);
  if (!endsAt) return false;

  return now.getTime() < endsAt.getTime();
}
