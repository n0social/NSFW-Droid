import { cookies } from "next/headers";
import type { ThemeOverridePreference } from "./types";
import { resolveActiveTheme, resolveScheduledTheme } from "./resolve";
import type { ResolvedTheme } from "./types";

export const THEME_OVERRIDE_COOKIE = "theme_override";

const VALID: ThemeOverridePreference[] = ["default", "auto"];

export function parseThemeOverride(value: string | undefined): ThemeOverridePreference | null {
  if (!value) return null;
  if (VALID.includes(value as ThemeOverridePreference)) {
    return value as ThemeOverridePreference;
  }
  return null;
}

/**
 * Future: load persisted preference from the user account.
 * Until accounts ship, returns null and cookie resolution handles everyone.
 */
export async function getUserThemePreference(userId?: string): Promise<ThemeOverridePreference | null> {
  if (userId) {
    /* account-backed preference will load here */
  }
  return null;
}

export async function getThemeOverrideFromCookies(): Promise<ThemeOverridePreference | null> {
  const jar = await cookies();
  return parseThemeOverride(jar.get(THEME_OVERRIDE_COOKIE)?.value);
}

export async function resolveThemeForRequest(now = new Date()): Promise<{
  active: ResolvedTheme;
  scheduled: ResolvedTheme;
  preference: ThemeOverridePreference | null;
}> {
  const preference = await getThemeOverrideFromCookies();
  const active = resolveActiveTheme(now, preference);
  const scheduled = resolveScheduledTheme(now);
  return {
    active,
    scheduled: { ...scheduled, source: scheduled.id === "default" ? "default" : "schedule" },
    preference,
  };
}

export const themeCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};
