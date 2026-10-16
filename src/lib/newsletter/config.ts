import { siteUrl } from "@/lib/site";

export const DEFAULT_NEWSLETTER_FROM_NAME = "NSFW Droid";
const RESEND_SANDBOX_FROM = "onboarding@resend.dev";

/** Parses `Display Name <addr@domain>` or a bare email address. */
export function parseEmailFromEnv(raw: string): { email: string; displayName?: string } {
  const trimmed = raw.trim();
  const angle = /^(.+?)\s*<([^>]+)>$/.exec(trimmed);
  if (angle) {
    const name = angle[1].trim().replace(/^"(.*)"$/, "$1");
    return { displayName: name, email: angle[2].trim() };
  }
  return { email: trimmed };
}

/** RFC-style From header for Resend (`from` JSON field). */
export function formatResendFromHeader(email: string, displayName?: string): string {
  if (!displayName?.trim()) {
    return email;
  }
  const name = displayName.trim();
  if (/[,<>"]/.test(name)) {
    const escaped = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}" <${email}>`;
  }
  return `${name} <${email}>`;
}

function rawNewsletterFromEnv(): string {
  return (
    process.env.NEWSLETTER_FROM?.trim() ||
    process.env.ALERT_EMAIL_FROM?.trim() ||
    RESEND_SANDBOX_FROM
  );
}

/** Resend `from` value for newsletter + confirm emails (includes display name when configured). */
export function newsletterFromAddress(): string {
  const parsed = parseEmailFromEnv(rawNewsletterFromEnv());
  const displayName =
    parsed.displayName ||
    process.env.NEWSLETTER_FROM_NAME?.trim() ||
    DEFAULT_NEWSLETTER_FROM_NAME;
  return formatResendFromHeader(parsed.email, displayName);
}

export function newsletterPublicBaseUrl(): string {
  const fromEnv =
    process.env.NEWSLETTER_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    siteUrl;
  return fromEnv.replace(/\/$/, "");
}

export function isNewsletterMassSendEnabled(): boolean {
  return process.env.NEWSLETTER_ENABLED === "1";
}

export const WEEKLY_NEWSLETTER_SUBJECT =
  "Thanks for being a member: Here's our favorite NSFW games of the week";
