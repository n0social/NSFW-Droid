import { createHash } from "crypto";
import type { ListingReportReason } from "@/db/schema";

export const LISTING_REPORT_REASONS: {
  value: ListingReportReason;
  label: string;
}[] = [
  { value: "wrong_content", label: "Wrong or misleading content" },
  { value: "broken_link", label: "Store link broken or wrong" },
  { value: "spam", label: "Spam or duplicate listing" },
  { value: "copyright", label: "Copyright or trademark issue" },
  { value: "other", label: "Other" },
];

const REASON_SET = new Set<string>(LISTING_REPORT_REASONS.map((r) => r.value));

export function isListingReportReason(value: string): value is ListingReportReason {
  return REASON_SET.has(value);
}

export function hashReporterIp(ip: string): string {
  const secret = process.env.SESSION_SECRET?.trim() || "listing-report";
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex").slice(0, 32);
}

export const listingReportSupportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@nsfwdroid.com";

export function listingReportMailtoUrl(
  listingTitle: string,
  listingSlug: string,
  reason: string,
  details: string,
): string {
  const subject = encodeURIComponent(`Listing report: ${listingTitle}`);
  const body = encodeURIComponent(
    `Listing: ${listingTitle}\nSlug: ${listingSlug}\nReason: ${reason}\n\nDetails:\n${details}`,
  );
  return `mailto:${listingReportSupportEmail}?subject=${subject}&body=${body}`;
}
