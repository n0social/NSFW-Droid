import "dotenv/config";
import { XMLParser } from "fast-xml-parser";
import {
  USER_AGENT,
  upsertCandidate,
  touchIngestSource,
} from "./lib/ingest-common";

const FEED_URL = "https://itch.io/feed/new.xml";

export async function runItchIngest() {
  const res = await fetch(FEED_URL, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`itch feed HTTP ${res.status}`);
  }
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);
  const items = doc?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];

  let inserted = 0;
  for (const item of list) {
    const title = String(item.title ?? "").trim();
    const link = String(item.link ?? "").trim();
    const guid = String(item.guid?.["#text"] ?? item.guid ?? link).trim();
    if (!title || !link) continue;

    const ok = await upsertCandidate({
      source: "itch",
      externalId: guid,
      title,
      outboundUrl: link,
      rawPayload: item,
    });
    if (ok) inserted += 1;
  }

  await touchIngestSource("itch_new_xml", { fetched: list.length, inserted });
  return { source: "itch", feedItems: list.length, newCandidates: inserted };
}

async function main() {
  const result = await runItchIngest();
  console.log(JSON.stringify(result));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
