import { INTERNAL_ANALYTICS_HEADER } from "../../src/lib/analytics-quality";

/** Merge into fetch headers when a script loads public pages or /api/go for QA. */
export function internalAnalyticsProbeHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  return { [INTERNAL_ANALYTICS_HEADER]: "1", ...extra };
}
