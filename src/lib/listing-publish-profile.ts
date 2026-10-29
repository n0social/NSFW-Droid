import type { Candidate, Listing } from "@/db/schema";
import { extractCoverImageUrl } from "@/lib/listing-cover";

/** Stored on rejected candidates when ingest cannot derive a store cover URL. */
export const MISSING_STORE_COVER_REJECT_REASON = "missing_store_cover";

export function storeCoverUrlFromIngest(
  source: Candidate["source"] | Listing["source"] | null | undefined,
  rawPayload: unknown,
): string | null {
  if (!source) return null;
  if (source === "manual" || source === "developer_form") return null;
  return extractCoverImageUrl(source, rawPayload);
}

export function listingHasPublishableCover(
  listing: Pick<Listing, "coverImageUrl">,
): boolean {
  return Boolean(listing.coverImageUrl?.trim());
}

export function candidateHasPublishableStoreCover(
  candidate: Pick<Candidate, "source" | "rawPayload">,
): boolean {
  return Boolean(storeCoverUrlFromIngest(candidate.source, candidate.rawPayload)?.trim());
}
