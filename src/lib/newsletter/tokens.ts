import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export function generateNewsletterToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashNewsletterToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newsletterSigningSecret(): string {
  return (
    process.env.NEWSLETTER_TOKEN_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    "dev-newsletter-signing-secret"
  );
}

/** Signed token for one-click unsubscribe in weekly mail (no plaintext stored). */
export function createUnsubscribeToken(subscriberId: string): string {
  const sig = createHmac("sha256", newsletterSigningSecret())
    .update(`unsub:${subscriberId}`)
    .digest("base64url");
  return `${subscriberId}.${sig}`;
}

export function parseUnsubscribeToken(token: string): string | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!id || !sig) return null;
  const expected = createHmac("sha256", newsletterSigningSecret())
    .update(`unsub:${id}`)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return id;
}

export function normalizeSubscriberEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 320);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidSubscriberEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 320;
}
