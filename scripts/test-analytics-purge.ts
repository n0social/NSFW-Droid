import {
  AGE_VERIFIED_SESSION_HASH,
  ANON_SESSION_HASH,
  visitorOutboundClickSql,
} from "../src/lib/analytics-quality";
import {
  inflatedAnalyticsEventSql,
  isInflatedAnalyticsRow,
  isVisitorQualityAnalyticsRow,
  type AnalyticsEventPurgeRow,
} from "../src/lib/analytics-purge";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";

const perBrowser = "abc123abc123abc123abc123abc123ab";
const problems: string[] = [];

function row(partial: AnalyticsEventPurgeRow): AnalyticsEventPurgeRow {
  return partial;
}

function expectInflated(name: string, r: AnalyticsEventPurgeRow, inflated: boolean) {
  const got = isInflatedAnalyticsRow(r);
  if (got !== inflated) problems.push(`${name}: inflated=${got}, wanted=${inflated}`);
  const quality = isVisitorQualityAnalyticsRow(r);
  if (quality === inflated) problems.push(`${name}: quality should be !inflated`);
}

expectInflated(
  "valid play click",
  row({
    eventType: "outbound_click",
    referrer: "https://www.nsfwdroid.com/browse",
    sessionHash: perBrowser,
    metadata: { linkKind: "official" },
  }),
  false,
);

expectInflated(
  "crawler no referrer",
  row({
    eventType: "outbound_click",
    referrer: null,
    sessionHash: perBrowser,
    metadata: { linkKind: "official" },
  }),
  true,
);

expectInflated(
  "admin referrer",
  row({
    eventType: "outbound_click",
    referrer: "https://nsfwdroid.com/admin/traffic",
    sessionHash: perBrowser,
    metadata: { linkKind: "official" },
  }),
  true,
);

expectInflated(
  "shared age-gate session",
  row({
    eventType: "outbound_click",
    referrer: "https://www.nsfwdroid.com/",
    sessionHash: AGE_VERIFIED_SESSION_HASH,
    metadata: { linkKind: "official" },
  }),
  true,
);

expectInflated(
  "anon session",
  row({
    eventType: "outbound_click",
    referrer: "https://www.nsfwdroid.com/",
    sessionHash: ANON_SESSION_HASH,
    metadata: { linkKind: "official" },
  }),
  true,
);

expectInflated(
  "stored bot ua",
  row({
    eventType: "outbound_click",
    referrer: "https://www.nsfwdroid.com/",
    sessionHash: perBrowser,
    metadata: { linkKind: "official", userAgent: "curl/8.5.0" },
  }),
  true,
);

expectInflated(
  "tagged internal",
  row({
    eventType: "outbound_click",
    referrer: "https://www.nsfwdroid.com/",
    sessionHash: perBrowser,
    metadata: { internal: "1" },
  }),
  true,
);

expectInflated(
  "valid listing view",
  row({
    eventType: "listing_view",
    path: "/",
    sessionHash: perBrowser,
  }),
  false,
);

expectInflated(
  "listing view shared session",
  row({
    eventType: "listing_view",
    path: "/",
    sessionHash: AGE_VERIFIED_SESSION_HASH,
  }),
  true,
);

expectInflated(
  "page view shared session",
  row({ eventType: "page_view", sessionHash: AGE_VERIFIED_SESSION_HASH }),
  true,
);

expectInflated(
  "page view per browser",
  row({ eventType: "page_view", sessionHash: perBrowser }),
  false,
);

async function sqlIntegration() {
  const client = new PGlite();
  await client.waitReady;
  await client.exec(`
    CREATE TYPE analytics_event_type AS ENUM ('outbound_click', 'listing_view', 'page_view');
    CREATE TABLE analytics_event (
      id uuid PRIMARY KEY,
      event_type analytics_event_type NOT NULL,
      listing_id uuid,
      path text,
      referrer text,
      session_hash text,
      metadata jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await client.query(
    `INSERT INTO analytics_event (id, event_type, path, referrer, session_hash, metadata) VALUES
      ('00000000-0000-4000-8000-000000000001', 'outbound_click', '/go/a', 'https://www.nsfwdroid.com/', $1, '{"linkKind":"official"}'),
      ('00000000-0000-4000-8000-000000000007', 'outbound_click', '/go/e', 'https://www.nsfwdroid.com/', 'abc123abc123abc123abc123abc123ab', '{"linkKind":"official"}')`,
    [AGE_VERIFIED_SESSION_HASH],
  );
  const db = drizzle(client);
  const inflated = inflatedAnalyticsEventSql();
  const play = visitorOutboundClickSql();
  const counts = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM analytics_event WHERE ${inflated}) AS inflated,
      (SELECT count(*)::int FROM analytics_event WHERE ${play}) AS play_sql
  `);
  const countRow = counts.rows[0] as { inflated: number; play_sql: number };
  if (Number(countRow.inflated) !== 1) problems.push(`sql inflated count ${countRow.inflated}`);
  if (Number(countRow.play_sql) !== 2) problems.push(`sql play count ${countRow.play_sql}`);
  await client.close();
}

async function main() {
  await sqlIntegration();
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log("ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
