/**
 * Ops: confirm pending newsletter subscribers (double opt-in bypass).
 * Usage: tsx scripts/newsletter-confirm-pending.ts [email]
 */
import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";
import { newsletterSubscribers } from "../src/db/schema";
import { normalizeSubscriberEmail } from "../src/lib/newsletter/tokens";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const shown = local.length <= 2 ? `${local[0]}*` : `${local.slice(0, 2)}***`;
  return `${shown}@${domain}`;
}

async function main() {
  const filter = process.argv[2]?.trim();
  const normalizedFilter = filter ? normalizeSubscriberEmail(filter) : null;

  const db = await getDb();
  const pending = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "pending"));

  if (!pending.length) {
    console.log("[newsletter-confirm-pending] no pending subscribers");
    await closeCatalogDb();
    return;
  }

  const now = new Date();
  let confirmed = 0;
  for (const row of pending) {
    if (normalizedFilter && row.email !== normalizedFilter) continue;
    await db
      .update(newsletterSubscribers)
      .set({ status: "active", confirmedAt: now })
      .where(eq(newsletterSubscribers.id, row.id));
    confirmed += 1;
    console.log(`[newsletter-confirm-pending] confirmed ${maskEmail(row.email)}`);
  }

  if (normalizedFilter && confirmed === 0) {
    console.error(`[newsletter-confirm-pending] no pending row for ${maskEmail(normalizedFilter)}`);
    await closeCatalogDb();
    process.exit(1);
  }

  const [activeRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "active"));

  console.log(JSON.stringify({ confirmed, activeSubscribers: activeRow?.count ?? 0 }));
  await closeCatalogDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
