import "dotenv/config";
import { XMLParser } from "fast-xml-parser";
import {
  USER_AGENT,
  upsertCandidate,
  touchIngestSource,
  sleep,
} from "./lib/ingest-common";
import { defaultItchFeedUrls } from "./lib/itch-feeds";
import { extractItchItemTags, itchPlatformsFromItem } from "./lib/tag-extract";

function feedUrls(): string[] {
  const raw = process.env.ITCH_FEED_URLS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
  }
  return defaultItchFeedUrls();
}

function feedDelayMs() {
  return Number(process.env.ITCH_FEED_DELAY_MS ?? "500");
}

async function fetchFeed(url: string, attempt = 0): Promise<Response> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (res.status === 429 && attempt < 4) {
    const wait = Number(process.env.ITCH_RATE_LIMIT_BACKOFF_MS ?? "2500") * (attempt + 1);
    await sleep(wait);
    return fetchFeed(url, attempt + 1);
  }
  return res;
}

async function ingestFeed(url: string) {
  const res = await fetchFeed(url);
  if (!res.ok) {
    return {
      feedItems: 0,
      newCandidates: 0,
      itemsWithTags: 0,
      error: `HTTP ${res.status}`,
    };
  }
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);
  const items = doc?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];

  let inserted = 0;
  let tagged = 0;
  for (const item of list) {
    const title = String(item.title ?? item.plainTitle ?? "").trim();
    const link = String(item.link ?? "").trim();
    const guid = String(item.guid?.["#text"] ?? item.guid ?? link).trim();
    if (!title || !link) continue;

    const platforms = itchPlatformsFromItem(item as Record<string, unknown>);
    const tagList = extractItchItemTags(item as Record<string, unknown>, url);

    const ok = await upsertCandidate({
      source: "itch",
      externalId: guid,
      title,
      outboundUrl: link,
      rawPayload: { ...item, feedUrl: url, platforms, extractedTags: tagList },
      tags: tagList,
    });
    if (ok) inserted += 1;
    if (tagList.length) tagged += 1;
  }

  return { feedItems: list.length, newCandidates: inserted, itemsWithTags: tagged };
}

export async function runItchIngest() {
  const urls = feedUrls();
  let totalItems = 0;
  let totalInserted = 0;
  let totalTagged = 0;
  const feedErrors: { url: string; error: string }[] = [];
  for (const url of urls) {
    const r = await ingestFeed(url);
    if ("error" in r && r.error) {
      feedErrors.push({ url, error: r.error });
      await sleep(feedDelayMs() * 2);
      continue;
    }
    totalItems += r.feedItems;
    totalInserted += r.newCandidates;
    totalTagged += r.itemsWithTags;
    await sleep(feedDelayMs());
  }

  await touchIngestSource("itch_rss", {
    feeds: urls,
    fetched: totalItems,
    inserted: totalInserted,
    tagged: totalTagged,
    feedErrors,
  });
  return {
    source: "itch",
    feeds: urls.length,
    feedItems: totalItems,
    newCandidates: totalInserted,
    itemsWithTags: totalTagged,
    feedErrors,
  };
}

async function cliMain() {
  const result = await runItchIngest();
  console.log(JSON.stringify(result));
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("ingest-itch.ts");
if (isDirectRun) {
  cliMain().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
