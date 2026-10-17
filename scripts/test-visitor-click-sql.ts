import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import {
  AGE_VERIFIED_SESSION_HASH,
  uniqueBrowserSessionSql,
  visitorOutboundClickSql,
} from "../src/lib/analytics-quality";

async function main() {
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

const hash = AGE_VERIFIED_SESSION_HASH;
await client.query(
  `INSERT INTO analytics_event (id, event_type, path, referrer, session_hash, metadata) VALUES
    ('00000000-0000-4000-8000-000000000001', 'outbound_click', '/go/a', 'https://www.nsfwdroid.com/', $1, '{"linkKind":"official"}'),
    ('00000000-0000-4000-8000-000000000002', 'outbound_click', '/go/b', 'https://www.nsfwdroid.com/browse', $1, '{"linkKind":"affiliate"}'),
    ('00000000-0000-4000-8000-000000000003', 'outbound_click', '/go/c', NULL, '5430eeed859cad61d925097ec4f53246', '{"linkKind":"official"}'),
    ('00000000-0000-4000-8000-000000000004', 'outbound_click', '/go/d', 'https://nsfwdroid.com/admin', $1, '{"linkKind":"official"}'),
    ('00000000-0000-4000-8000-000000000005', 'listing_view', '/', NULL, $1, NULL),
    ('00000000-0000-4000-8000-000000000006', 'listing_view', '/game/demo', NULL, $1, NULL),
    ('00000000-0000-4000-8000-000000000007', 'outbound_click', '/go/e', 'https://www.nsfwdroid.com/', 'abc123abc123abc123abc123abc123ab', '{"linkKind":"official"}'),
    ('00000000-0000-4000-8000-000000000008', 'listing_view', '/', NULL, 'abc123abc123abc123abc123abc123ab', NULL)`,
  [hash],
);

const db = drizzle(client);
const play = visitorOutboundClickSql();
const browsers = uniqueBrowserSessionSql();
const counts = await db.execute(sql`
  SELECT
    (SELECT count(*)::int FROM analytics_event WHERE ${play}) AS play_clicks,
    (SELECT count(*)::int FROM analytics_event WHERE event_type = 'outbound_click' AND NOT (${play})) AS unverified,
    (SELECT count(*)::int FROM analytics_event WHERE event_type = 'listing_view' AND path = '/') AS cards,
    (SELECT count(*)::int FROM analytics_event WHERE event_type = 'listing_view' AND path LIKE '/game/%') AS details,
    (SELECT count(*)::int FROM analytics_event WHERE ${play} AND metadata->>'linkKind' = 'affiliate') AS affiliate,
    (SELECT count(distinct session_hash)::int FROM analytics_event WHERE ${play} AND ${browsers}) AS unique_play
`);
const row = counts.rows[0] as Record<string, number>;
const problems: string[] = [];
if (Number(row.play_clicks) !== 3) problems.push(`play_clicks ${row.play_clicks}`);
if (Number(row.unique_play) !== 1) problems.push(`unique_play ${row.unique_play}`);
if (Number(row.unverified) !== 2) problems.push(`unverified ${row.unverified}`);
if (Number(row.cards) !== 2) problems.push(`cards ${row.cards}`);
if (Number(row.details) !== 1) problems.push(`details ${row.details}`);
if (Number(row.affiliate) !== 1) problems.push(`affiliate ${row.affiliate}`);

await client.close();
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
