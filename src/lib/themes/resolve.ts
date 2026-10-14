import { DEFAULT_THEME } from "./default-theme";
import { getThemeById, loadThemeRegistry } from "./registry";
import type { ResolvedTheme, ThemeDefinition, ThemeOverridePreference } from "./types";

function utcMonth(date: Date): number {
  return date.getUTCMonth() + 1;
}

/**
 * Holiday theme for the given calendar date (UTC), ignoring user preference.
 */
export function resolveScheduledTheme(date: Date = new Date()): ThemeDefinition {
  const month = utcMonth(date);
  const holidays = loadThemeRegistry().filter((t) => t.id !== "default");
  const match = holidays.find((t) => t.schedule.months.includes(month));
  return match ?? DEFAULT_THEME;
}

/**
 * Active theme for rendering: user override wins, then schedule, then default.
 */
export function resolveActiveTheme(
  date: Date = new Date(),
  preference: ThemeOverridePreference | null = null,
): ResolvedTheme {
  const scheduled = resolveScheduledTheme(date);

  if (preference === "default") {
    return { ...DEFAULT_THEME, source: "override" };
  }

  if (scheduled.id !== "default") {
    return { ...getThemeById(scheduled.id), source: "schedule" };
  }

  return { ...DEFAULT_THEME, source: "default" };
}
