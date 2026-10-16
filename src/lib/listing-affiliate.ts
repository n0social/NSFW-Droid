import { affiliatePairsWithOfficial } from "@/lib/outbound-link";
import { itchAffiliateUrlForOfficial } from "@/lib/itch-affiliate";

/** Keep affiliate_url aligned with official_url after ingest or review. */
export function resolveListingAffiliateUrl(
  officialUrl: string,
  opts: {
    rawAffiliate?: string | null;
    existingAffiliate?: string | null;
  },
): string | null {
  const official = officialUrl.trim();
  if (!official) return null;

  const raw = opts.rawAffiliate?.trim();
  if (raw && affiliatePairsWithOfficial(official, raw)) return raw;

  const fromEnv = itchAffiliateUrlForOfficial(official);
  if (fromEnv) return fromEnv;

  const existing = opts.existingAffiliate?.trim();
  if (existing && affiliatePairsWithOfficial(official, existing)) return existing;

  return null;
}
