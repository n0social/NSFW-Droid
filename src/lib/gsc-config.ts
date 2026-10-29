/** Google Search Console API — server env only (never commit JSON keys). */

export const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export type GscConfigStatus =
  | { configured: true; propertyUrl: string }
  | { configured: false; missing: string[] };

function defaultPropertyUrl(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  return site ? `${site}/` : "https://www.nsfwdroid.com/";
}

export function getGscPropertyUrl(): string {
  const raw = process.env.GSC_PROPERTY_URL?.trim();
  if (raw) {
    return raw.endsWith("/") ? raw : `${raw}/`;
  }
  return defaultPropertyUrl();
}

export function parseGscServiceAccount(): Record<string, string> | null {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isGscSyncEnabled(): boolean {
  const flag = process.env.GSC_SYNC_ENABLED?.trim().toLowerCase();
  if (flag === "0" || flag === "false") return false;
  return parseGscServiceAccount() !== null;
}

export function getGscConfigStatus(): GscConfigStatus {
  const missing: string[] = [];
  if (!parseGscServiceAccount()) {
    missing.push("GSC_SERVICE_ACCOUNT_JSON");
  }
  if (missing.length > 0) {
    return { configured: false, missing };
  }
  return { configured: true, propertyUrl: getGscPropertyUrl() };
}

export function gscCachePath(): string {
  return process.env.GSC_CACHE_PATH?.trim() || "data/.gsc-search-cache.json";
}

/** Default lookback for admin charts (GSC Performance default). */
export function gscWindowDays(): number {
  const n = Number(process.env.GSC_WINDOW_DAYS ?? "28");
  return Number.isFinite(n) && n >= 7 && n <= 90 ? Math.floor(n) : 28;
}
