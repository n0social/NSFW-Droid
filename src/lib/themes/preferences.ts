import { cookies } from "next/headers";
import type { ThemeOverridePreference } from "./types";
import { resolveActiveTheme, resolveScheduledTheme } from "./resolve";
import type { ResolvedTheme } from "./types";
import { getSessionUserId } from "@/lib/user-session";
import { getUserProfile, parseUserPreferences } from "@/lib/user-profile";

export const THEME_OVERRIDE_COOKIE = "theme_override";

const VALID: ThemeOverridePreference[] = ["default", "auto"];

export function parseThemeOverride(value: string | undefined): ThemeOverridePreference | null {
  if (!value) return null;
  if (VALID.includes(value as ThemeOverridePreference)) {
    return value as ThemeOverridePreference;
  }
  return null;
}

/** Load holiday theme opt-out from `user_profile.preferences` when signed in. */
export async function getUserThemePreference(userId?: string): Promise<ThemeOverridePreference | null> {
  if (!userId) return null;
  try {
    const profile = await getUserProfile(userId);
    const pref = parseUserPreferences(profile?.preferences).theme_preference;
    return parseThemeOverride(pref);
  } catch {
    return null;
  }
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
  const cookiePreference = await getThemeOverrideFromCookies();
  const uid = await getSessionUserId();
  const profilePreference = uid ? await getUserThemePreference(uid) : null;
  const preference = cookiePreference ?? profilePreference;
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
