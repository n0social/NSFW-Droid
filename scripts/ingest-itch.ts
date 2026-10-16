import "dotenv/config";
import { XMLParser } from "fast-xml-parser";
import {
  USER_AGENT,
  upsertCandidate,
  touchIngestSource,
  sleep,
} from "./lib/ingest-common";
import {
  isItchNsfwOnlyMode,
  isMatureItchItem,
} from "../src/lib/catalog-maturity";
import { defaultItchFeedUrls } from "./lib/itch-feeds";
import {
  feedItemMatchesSeed,
  itchManualExternalId,
  loadItchManualGameSeeds,
  type ItchManualGameSeed,
} from "./lib/itch-manual-seeds";
import { extractItchItemTags, itchPlatformsFromItem } from "./lib/tag-extract";
import { itchAffiliateCodeFromEnv, itchAffiliateUrlForOfficial } from "../src/lib/itch-affiliate";

async function feedUrls(): Promise<string[]> {
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

function responseLooksLikeRss(res: Response, bodyPeek: string): boolean {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("xml") || ct.includes("rss")) return true;
  const t = bodyPeek.trimStart();
  return t.startsWith("<?xml") || t.startsWith("<rss");
}

async function upsertManualSeed(
  seed: ItchManualGameSeed,
  reason: string,
): Promise<boolean> {
  const externalId = itchManualExternalId(seed);
  const link = seed.officialUrl.trim();
  return upsertCandidate({
    source: "itch",
    externalId,
    title: seed.title.trim(),
    outboundUrl: link,
    rawPayload: {
      manualItchSeed: true,
      manualSeedReason: reason,
      notes: seed.notes ?? null,
      officialUrl: link,
      feedUrl: seed.feedUrl ?? null,
    },
    tags: [{ slug: "itch-manual-seed", label: "Manual itch seed", kind: "source" }],
  });
}

async function ingestManualSeed(seed: ItchManualGameSeed) {
  const feedUrl = seed.feedUrl?.trim();
  if (!feedUrl) {
    const ok = await upsertManualSeed(seed, "no_feed_url");
    return { mode: "static" as const, inserted: ok ? 1 : 0, error: null };
  }

  const res = await fetchFeed(feedUrl);
  if (res.status === 403) {
    console.warn(
      `[itch-manual] HTTP 403 for feed ${feedUrl} (${seed.title}); static seed when possible`,
    );
    const ok = await upsertManualSeed(seed, "feed_403");
    return { mode: "static_after_403" as const, inserted: ok ? 1 : 0, error: "HTTP 403" };
  }
  if (!res.ok) {
    console.warn(`[itch-manual] HTTP ${res.status} for ${feedUrl} (${seed.title})`);
    const ok = await upsertManualSeed(seed, `feed_http_${res.status}`);
    return {
      mode: "static_after_error" as const,
      inserted: ok ? 1 : 0,
      error: `HTTP ${res.status}`,
    };
  }

  const xml = await res.text();
  if (!responseLooksLikeRss(res, xml)) {
    console.warn(
      `[itch-manual] non-XML response for ${feedUrl} (${seed.title}); static seed`,
    );
    const ok = await upsertManualSeed(seed, "feed_not_xml");
    return { mode: "static_not_xml" as const, inserted: ok ? 1 : 0, error: "not_xml" };
  }

  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);
  const items = doc?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];

  const match = list.find((item: Record<string, unknown>) => {
    const link = String(item.link ?? "").trim();
    return link && feedItemMatchesSeed(link, seed);
  });

  if (!match) {
    const ok = await upsertManualSeed(seed, "feed_no_matching_item");
    return { mode: "static_no_match" as const, inserted: ok ? 1 : 0, error: null };
  }

  const plainTitle = String(match.plainTitle ?? "").trim();
  const rssTitle = String(match.title ?? "").trim();
  const title = plainTitle || rssTitle || seed.title;
  const link = String(match.link ?? seed.officialUrl).trim();
  const guid = String(match.guid?.["#text"] ?? match.guid ?? link).trim();
  const tagList = extractItchItemTags(match as Record<string, unknown>, feedUrl);
  const affiliateUrl = itchAffiliateUrlForOfficial(link);

  const ok = await upsertCandidate({
    source: "itch",
    externalId: guid,
    title,
    outboundUrl: link,
    rawPayload: {
      ...match,
      feedUrl,
      manualItchSeed: true,
      manualSeedMatch: seed.title,
      platforms: itchPlatformsFromItem(match as Record<string, unknown>),
      extractedTags: tagList,
      ...(affiliateUrl ? { affiliate_url: affiliateUrl } : {}),
    },
    tags: tagList,
  });
  return { mode: "rss_match" as const, inserted: ok ? 1 : 0, error: null };
}

async function ingestFeed(url: string) {
  const res = await fetchFeed(url);
  if (!res.ok) {
    const err =
      res.status === 403
        ? `HTTP 403 (blocked — use data/itch-manual-game-urls.json)`
        : `HTTP ${res.status}`;
    return {
      feedItems: 0,
      newCandidates: 0,
      itemsWithTags: 0,
      error: err,
    };
  }
  const xml = await res.text();
  if (!responseLooksLikeRss(res, xml)) {
    return {
      feedItems: 0,
      newCandidates: 0,
      itemsWithTags: 0,
      error: "not_xml (search RSS often returns HTML)",
    };
  }
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);
  const items = doc?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];

  let inserted = 0;
  let tagged = 0;
  let skippedNonMature = 0;
  let affiliateUrlsSet = 0;
  for (const item of list) {
    const plainTitle = String(item.plainTitle ?? "").trim();
    const rssTitle = String(item.title ?? "").trim();
    const title = plainTitle || rssTitle;
    const link = String(item.link ?? "").trim();
    const guid = String(item.guid?.["#text"] ?? item.guid ?? link).trim();
    if (!title || !link) continue;

    const platforms = itchPlatformsFromItem(item as Record<string, unknown>);
    const tagList = extractItchItemTags(item as Record<string, unknown>, url);
    const tagSlugs = tagList.map((t) => t.slug);
    if (isItchNsfwOnlyMode() && !isMatureItchItem(item as Record<string, unknown>, url, tagSlugs)) {
      skippedNonMature += 1;
      continue;
    }

    const affiliateUrl = itchAffiliateUrlForOfficial(link);
    if (affiliateUrl) affiliateUrlsSet += 1;

    const ok = await upsertCandidate({
      source: "itch",
      externalId: guid,
      title,
      outboundUrl: link,
      rawPayload: {
        ...item,
        feedUrl: url,
        platforms,
        extractedTags: tagList,
        ...(affiliateUrl ? { affiliate_url: affiliateUrl } : {}),
      },
      tags: tagList,
    });
    if (ok) inserted += 1;
    if (tagList.length) tagged += 1;
  }

  return {
    feedItems: list.length,
    newCandidates: inserted,
    itemsWithTags: tagged,
    skippedNonMature,
    affiliateUrlsSet,
  };
}

export async function runItchIngest() {
  const urls = await feedUrls();
  let totalItems = 0;
  let totalInserted = 0;
  let totalTagged = 0;
  let totalSkippedNonMature = 0;
  let totalAffiliateUrlsSet = 0;
  const feedErrors: { url: string; error: string }[] = [];
  const manualSeeds = await loadItchManualGameSeeds();
  const manualResults: Record<string, unknown>[] = [];
  let manualInserted = 0;
  for (const seed of manualSeeds) {
    const r = await ingestManualSeed(seed);
    manualInserted += r.inserted;
    manualResults.push({ title: seed.title, ...r });
    await sleep(feedDelayMs());
  }

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
    totalSkippedNonMature += r.skippedNonMature ?? 0;
    totalAffiliateUrlsSet += r.affiliateUrlsSet ?? 0;
    await sleep(feedDelayMs());
  }

  const itchAffiliateCode = itchAffiliateCodeFromEnv();
  await touchIngestSource("itch_rss", {
    feeds: urls,
    fetched: totalItems,
    inserted: totalInserted,
    tagged: totalTagged,
    skippedNonMature: totalSkippedNonMature,
    affiliateUrlsSet: totalAffiliateUrlsSet,
    itchAffiliateEnabled: Boolean(itchAffiliateCode),
    itchNsfwOnly: isItchNsfwOnlyMode(),
    feedErrors,
    manualSeeds: manualSeeds.length,
    manualInserted,
    manualResults,
  });
  return {
    source: "itch",
    feeds: urls.length,
    feedItems: totalItems,
    newCandidates: totalInserted,
    itemsWithTags: totalTagged,
    skippedNonMature: totalSkippedNonMature,
    affiliateUrlsSet: totalAffiliateUrlsSet,
    itchAffiliateEnabled: Boolean(itchAffiliateCode),
    itchNsfwOnly: isItchNsfwOnlyMode(),
    feedErrors,
    manualSeeds: manualSeeds.length,
    manualInserted,
    manualResults,
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
