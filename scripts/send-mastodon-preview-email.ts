/**
 * One-off ops email: Mastodon post preview for human review.
 * Send via sendmail when NEWSLETTER_TRANSPORT=sendmail (droplet Exim).
 *
 * Usage (production):
 *   systemctl stop nsfwdroid   # PGlite lock
 *   set -a && source /etc/nsfwdroid.env && set +a
 *   npx tsx scripts/send-mastodon-preview-email.ts
 *   systemctl start nsfwdroid
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { eq, desc } from "drizzle-orm";
import { closeCatalogDb, getDb } from "../src/db";
import { listings, socialOutbox } from "../src/db/schema";
import {
  buildSocialPostPayload,
  formatMastodonStatus,
  type SocialPostPayload,
} from "../src/lib/social/compose";

const TO = "donavansky@gmail.com";
const SUBJECT = "NSFW Droid — Mastodon post preview (for review)";

const LIVE_POST_URL =
  "https://mastodon.social/@nsfwdroid/117457587147997355";

function resolveFrom(): string {
  return (
    process.env.NEWSLETTER_FROM?.trim() ||
    process.env.ALERT_EMAIL_FROM?.trim() ||
    "newsletter@nsfwdroid.com"
  );
}

function payloadFromStored(
  raw: unknown,
  row: { title: string; slug: string; affiliateUrl: string | null },
): SocialPostPayload {
  const p = raw as SocialPostPayload;
  if (p?.title && p?.url && p?.slug) return p;
  return buildSocialPostPayload({
    title: row.title,
    slug: row.slug,
    coverImageUrl: null,
    affiliateUrl: row.affiliateUrl,
  });
}

/** Fallback when PGlite cannot open on the droplet (still matches live outbox payloads). */
function fallbackSamples() {
  const live = formatMastodonStatus(
    buildSocialPostPayload({
      title: "Furry Heat Nights",
      slug: "furry-heat-nights-urry-heat-nights",
      coverImageUrl: null,
      affiliateUrl: null,
    }),
  );
  const pendingTexts = [
    formatMastodonStatus(
      buildSocialPostPayload({
        title: "Lecherous Village - Demo",
        slug: "lecherous-village-demo-ous-village-demo",
        coverImageUrl: null,
        affiliateUrl: null,
      }),
    ),
    formatMastodonStatus(
      buildSocialPostPayload({
        title: "HAREM！RANCH LIFE",
        slug: "harem-ranch-life-2420240",
        coverImageUrl: null,
        affiliateUrl: "https://store.steampowered.com/app/2420240",
      }),
    ),
  ];
  return { liveText: live, pendingTexts, pendingCount: 2 };
}

async function loadOutboxSamples() {
  try {
    const db = await getDb();
    const rows = await db
      .select({
        status: socialOutbox.status,
        platform: socialOutbox.platform,
        payload: socialOutbox.payload,
        title: listings.title,
        slug: listings.slug,
        affiliateUrl: listings.affiliateUrl,
        externalId: socialOutbox.externalId,
      })
      .from(socialOutbox)
      .innerJoin(listings, eq(socialOutbox.listingId, listings.id))
      .orderBy(desc(socialOutbox.createdAt))
      .limit(10);

    const posted = rows.filter(
      (r) => r.status === "posted" && r.platform === "mastodon",
    );
    const pending = rows.filter(
      (r) => r.status === "pending" && r.platform === "mastodon",
    );

    const live =
      posted.find((r) => r.externalId === "117457587147997355") ?? posted[0];

    return {
      liveText: live
        ? formatMastodonStatus(
            payloadFromStored(live.payload, {
              title: live.title,
              slug: live.slug,
              affiliateUrl: live.affiliateUrl,
            }),
          )
        : null,
      pendingTexts: pending.map((r) =>
        formatMastodonStatus(
          payloadFromStored(r.payload, {
            title: r.title,
            slug: r.slug,
            affiliateUrl: r.affiliateUrl,
          }),
        ),
      ),
      pendingCount: pending.length,
    };
  } catch {
    return fallbackSamples();
  }
}

function buildBody(samples: {
  liveText: string | null;
  pendingTexts: string[];
  pendingCount: number;
}): string {
  const drainLimit = process.env.SOCIAL_DRAIN_LIMIT?.trim() ?? "(unset)";
  const lines: string[] = [
    "Mastodon post preview — please review before we enable automated drain.",
    "",
    "=== Live on Mastodon (already posted) ===",
    "",
    samples.liveText ??
      "Furry Heat Nights\n\nhttps://www.nsfwdroid.com/game/furry-heat-nights-urry-heat-nights\n\n#nsfwgames #furry",
    "",
    `Public URL: ${LIVE_POST_URL}`,
    "",
    "=== Pending in social_outbox (compose.ts format; not published yet) ===",
    "",
  ];

  if (samples.pendingTexts.length) {
    for (const [i, text] of samples.pendingTexts.entries()) {
      lines.push(`--- Pending ${i + 1} ---`, "", text, "");
    }
  } else {
    lines.push("(no pending mastodon rows in DB)", "");
  }

  lines.push(
    "=== Ops note ===",
    "",
    `SOCIAL_DRAIN_LIMIT=${drainLimit} — drain is paused; pending posts are not being published automatically.`,
    `${samples.pendingCount} mastodon row(s) still pending in social_outbox.`,
    "",
    "— NSFW Droid social automation",
  );

  return lines.join("\n");
}

function sendViaSendmail(from: string, to: string, subject: string, body: string) {
  const transport = process.env.NEWSLETTER_TRANSPORT?.trim() || "sendmail";
  if (transport !== "sendmail") {
    throw new Error(`NEWSLETTER_TRANSPORT must be sendmail for this script (got ${transport})`);
  }
  const message = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ].join("\n");

  const result = spawnSync("sendmail", ["-t", "-oi"], {
    input: message,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `sendmail failed status=${result.status} stderr=${result.stderr?.slice(0, 500)}`,
    );
  }
}

async function main() {
  const from = resolveFrom();
  const samples = await loadOutboxSamples();
  const body = buildBody(samples);
  sendViaSendmail(from, TO, SUBJECT, body);
  console.log(
    JSON.stringify({
      ok: true,
      to: TO,
      from,
      subject: SUBJECT,
      pendingCount: samples.pendingCount,
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => closeCatalogDb());
