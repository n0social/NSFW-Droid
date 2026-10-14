import "dotenv/config";
import { XMLParser } from "fast-xml-parser";
import {
  USER_AGENT,
  upsertCandidate,
  touchIngestSource,
} from "./lib/ingest-common";

const DEFAULT_FEEDS = ["https://itch.io/feed/new.xml"];

function feedUrls(): string[] {
  const raw = process.env.ITCH_FEED_URLS?.trim();
  if (!raw) return DEFAULT_FEEDS;
  return raw
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

async function ingestFeed(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`itch feed HTTP ${res.status} for ${url}`);
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
      rawPayload: { ...item, feedUrl: url },
    });
    if (ok) inserted += 1;
  }

  return { feedItems: list.length, newCandidates: inserted };
}

export async function runItchIngest() {
  const urls = feedUrls();
  let totalItems = 0;
  let totalInserted = 0;
  for (const url of urls) {
    const r = await ingestFeed(url);
    totalItems += r.feedItems;
    totalInserted += r.newCandidates;
  }

  await touchIngestSource("itch_rss", {
    feeds: urls,
    fetched: totalItems,
    inserted: totalInserted,
  });
  return {
    source: "itch",
    feeds: urls.length,
    feedItems: totalItems,
    newCandidates: totalInserted,
  };
}

async function main() {
  const result = await runItchIngest();
  console.log(JSON.stringify(result));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
