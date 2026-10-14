import type { UserPreferences } from "@/db/schema";

/** Apply stored profile preferences to theme/blur cookies after session is established. */
export async function syncProfilePreferencesToCookies(prefs: UserPreferences): Promise<void> {
  if (prefs.theme_preference === "default" || prefs.theme_preference === "auto") {
    await fetch("/api/theme/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preference: prefs.theme_preference }),
    });
  }
  if (typeof prefs.blur_covers === "boolean") {
    await fetch("/api/blur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: prefs.blur_covers }),
    });
  }
}

export async function fetchAndSyncProfilePreferences(): Promise<void> {
  const res = await fetch("/api/account/profile");
  if (!res.ok) return;
  const data = await res.json();
  const prefs = data?.profile?.preferences as UserPreferences | undefined;
  if (prefs) await syncProfilePreferencesToCookies(prefs);
}
