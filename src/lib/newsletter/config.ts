import { siteUrl } from "@/lib/site";

export const DEFAULT_NEWSLETTER_FROM_NAME = "NSFW Droid";
/** Fallback when no From env is set (local dev only — Brevo requires a verified domain in production). */
const NEWSLETTER_DEV_FALLBACK_FROM = "newsletter@example.com";

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

/** RFC-style From header for transactional email APIs. */
export function formatNewsletterFromHeader(email: string, displayName?: string): string {
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
    NEWSLETTER_DEV_FALLBACK_FROM
  );
}

/** From header for newsletter + confirm emails (includes display name when configured). */
export function newsletterFromAddress(): string {
  const parsed = parseEmailFromEnv(rawNewsletterFromEnv());
  const displayName =
    parsed.displayName ||
    process.env.NEWSLETTER_FROM_NAME?.trim() ||
    DEFAULT_NEWSLETTER_FROM_NAME;
  return formatNewsletterFromHeader(parsed.email, displayName);
}

/** @deprecated Use formatNewsletterFromHeader */
export const formatResendFromHeader = formatNewsletterFromHeader;

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

/** Droplet Exim uses sendmail. Anything else stays on Brevo. */
export function newsletterTransport(): "sendmail" | "brevo" {
  const transport = process.env.NEWSLETTER_TRANSPORT?.trim().toLowerCase();
  if (transport === "sendmail") return "sendmail";
  return "brevo";
}

/** True when `sendNewsletterEmail` can send (Brevo key or local sendmail transport). */
export function isNewsletterEmailDeliveryConfigured(): boolean {
  if (newsletterTransport() === "sendmail") {
    return true;
  }
  return Boolean(process.env.BREVO_API_KEY?.trim());
}

/** Local-only fallback; must not be used for HMAC unsubscribe tokens in production. */
export const NEWSLETTER_DEV_SIGNING_SECRET = "dev-newsletter-signing-secret";

export type NewsletterSigningSecretSource =
  | "newsletter_token_secret"
  | "session_secret"
  | "dev_fallback";

export function newsletterSigningSecretSource(): NewsletterSigningSecretSource {
  if (process.env.NEWSLETTER_TOKEN_SECRET?.trim()) return "newsletter_token_secret";
  if (process.env.SESSION_SECRET?.trim()) return "session_secret";
  return "dev_fallback";
}

/** HMAC key for one-click unsubscribe tokens (`NEWSLETTER_TOKEN_SECRET` → `SESSION_SECRET` → dev fallback). */
export function newsletterSigningSecret(): string {
  const explicit = process.env.NEWSLETTER_TOKEN_SECRET?.trim();
  if (explicit) return explicit;
  const session = process.env.SESSION_SECRET?.trim();
  if (session) return session;
  return NEWSLETTER_DEV_SIGNING_SECRET;
}

export function isNewsletterSigningSecretWeak(): boolean {
  return newsletterSigningSecretSource() === "dev_fallback";
}

/**
 * Production must not sign newsletter unsubscribe links with the dev fallback.
 * Returns an operator-facing message, or null when configuration is acceptable.
 */
export function newsletterSigningSecretProductionIssue(): string | null {
  if (process.env.NODE_ENV !== "production") return null;
  if (!isNewsletterSigningSecretWeak()) return null;
  return (
    "Set NEWSLETTER_TOKEN_SECRET or SESSION_SECRET in production; " +
    "refusing dev newsletter signing secret"
  );
}

export function assertNewsletterSigningSecretProduction(context: string): void {
  const issue = newsletterSigningSecretProductionIssue();
  if (issue) {
    throw new Error(`${issue} (${context})`);
  }
}

export const WEEKLY_NEWSLETTER_SUBJECT =
  "Thanks for being a member: Here's our favorite NSFW games of the week";
