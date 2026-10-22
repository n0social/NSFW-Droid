const DEFAULT_TZ = "America/New_York";

export function catalogWeekTimeZone(): string {
  return process.env.NEWSLETTER_WEEKLY_TZ?.trim() || DEFAULT_TZ;
}

type Ymd = { year: number; month: number; day: number };

function ymdInTimeZone(date: Date, timeZone: string): Ymd {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return {
    year: Number(parts.find((p) => p.type === "year")?.value ?? "0"),
    month: Number(parts.find((p) => p.type === "month")?.value ?? "1"),
    day: Number(parts.find((p) => p.type === "day")?.value ?? "1"),
  };
}

/** ISO weekday in zone: Monday = 1 … Sunday = 7. */
function isoWeekdayInTimeZone(date: Date, timeZone: string): number {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return map[wd] ?? 1;
}

function addCalendarDays(ymd: Ymd, delta: number): Ymd {
  const d = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day + delta));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** UTC instant for local midnight on a calendar day in `timeZone` (DST-aware). */
export function zonedMidnightUtc(ymd: Ymd, timeZone: string): Date {
  const guess = Date.UTC(ymd.year, ymd.month - 1, ymd.day, 12, 0, 0);
  const offsetMs = getTimeZoneOffsetMs(new Date(guess), timeZone);
  return new Date(guess - offsetMs - 12 * 60 * 60 * 1000);
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  const hours = Number(m[2]);
  const mins = Number(m[3] ?? "0");
  return sign * (hours * 60 + mins) * 60 * 1000;
}

/** Monday 00:00 in catalog week timezone, for the week containing `date`. */
export function startOfIsoWeekInTimeZone(date: Date, timeZone: string): Date {
  const ymd = ymdInTimeZone(date, timeZone);
  const isoDow = isoWeekdayInTimeZone(date, timeZone);
  const monday = addCalendarDays(ymd, -(isoDow - 1));
  return zonedMidnightUtc(monday, timeZone);
}

export type PreviousWeekFavoriteWindow = {
  /** Favorites with `created_at` in [statsStart, statsEnd). */
  statsStart: Date;
  statsEnd: Date;
  timeZone: string;
};

/** Previous calendar week (Mon–Sun) in site timezone; shown during the current week. */
export function previousWeekFavoriteWindow(
  now: Date = new Date(),
  timeZone: string = catalogWeekTimeZone(),
): PreviousWeekFavoriteWindow {
  const thisWeekStart = startOfIsoWeekInTimeZone(now, timeZone);
  const statsEnd = thisWeekStart;
  const statsStart = new Date(statsEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { statsStart, statsEnd, timeZone };
}

export function formatPreviousWeekRangeLabel(
  window: Pick<PreviousWeekFavoriteWindow, "statsStart" | "statsEnd" | "timeZone">,
): string {
  const endDay = new Date(window.statsEnd.getTime() - 1);
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: window.timeZone,
    month: "short",
    day: "numeric",
  };
  const startLabel = window.statsStart.toLocaleDateString("en-US", opts);
  const endLabel = endDay.toLocaleDateString("en-US", opts);
  return `${startLabel} – ${endLabel}`;
}
