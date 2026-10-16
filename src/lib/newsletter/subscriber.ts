import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import {
  generateNewsletterToken,
  hashNewsletterToken,
  normalizeSubscriberEmail,
} from "@/lib/newsletter/tokens";

export type SubscriberStatus = "pending" | "active" | "unsubscribed";

export async function upsertPendingSubscriber(
  email: string,
  source: string,
): Promise<{ token: string; email: string }> {
  const normalized = normalizeSubscriberEmail(email);
  const token = generateNewsletterToken();
  const tokenHash = hashNewsletterToken(token);
  const db = await getDb();

  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, normalized))
    .limit(1);

  if (existing[0]?.status === "active") {
    return { token: "", email: normalized };
  }

  if (existing[0]) {
    await db
      .update(newsletterSubscribers)
      .set({
        status: "pending",
        tokenHash,
        source,
        unsubscribedAt: null,
        confirmedAt: null,
      })
      .where(eq(newsletterSubscribers.email, normalized));
  } else {
    await db.insert(newsletterSubscribers).values({
      email: normalized,
      status: "pending",
      tokenHash,
      source,
    });
  }

  return { token, email: normalized };
}

export async function confirmSubscriberByToken(
  token: string,
): Promise<"confirmed" | "already_active" | "invalid"> {
  const tokenHash = hashNewsletterToken(token);
  const db = await getDb();
  const [row] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.tokenHash, tokenHash))
    .limit(1);

  if (!row) return "invalid";
  if (row.status === "active") return "already_active";

  await db
    .update(newsletterSubscribers)
    .set({
      status: "active",
      confirmedAt: new Date(),
    })
    .where(eq(newsletterSubscribers.id, row.id));

  return "confirmed";
}

export async function unsubscribeByToken(
  token: string,
): Promise<"unsubscribed" | "already_unsubscribed" | "invalid"> {
  const db = await getDb();
  const { parseUnsubscribeToken } = await import("@/lib/newsletter/tokens");
  const signedId = parseUnsubscribeToken(token);

  let row;
  if (signedId) {
    [row] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, signedId))
      .limit(1);
  } else {
    const tokenHash = hashNewsletterToken(token);
    [row] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.tokenHash, tokenHash))
      .limit(1);
  }

  if (!row) return "invalid";
  if (row.status === "unsubscribed") return "already_unsubscribed";

  await db
    .update(newsletterSubscribers)
    .set({
      status: "unsubscribed",
      unsubscribedAt: new Date(),
    })
    .where(eq(newsletterSubscribers.id, row.id));

  return "unsubscribed";
}

export async function listActiveSubscribers(): Promise<{ id: string; email: string }[]> {
  const db = await getDb();
  return db
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "active"));
}
