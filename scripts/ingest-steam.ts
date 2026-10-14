import "dotenv/config";
import { readFile } from "fs/promises";
import {
  USER_AGENT,
  upsertCandidate,
  touchIngestSource,
  sleep,
} from "./lib/ingest-common";
import { extractSteamTags } from "./lib/tag-extract";

const STEAM_DESCRIPTOR_ADULT_ONLY_SEXUAL = 3;
const STEAM_DESCRIPTOR_SEXUAL = 1;

type AppDetails = {
  success: boolean;
  data?: {
    name?: string;
    type?: string;
    short_description?: string;
    genres?: { id?: string; description?: string }[];
    categories?: { id?: number; description?: string }[];
    content_descriptors?: { ids?: number[] };
    platforms?: { windows?: boolean; mac?: boolean; linux?: boolean };
  };
};

async function fetchSteamAppDetails(appId: number) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const json = await res.json();
  const block = json[String(appId)] as AppDetails | undefined;
  if (!block?.success || !block.data) return null;
  return block.data;
}

function includeSexualDescriptor() {
  return process.env.STEAM_INCLUDE_SEXUAL_DESCRIPTOR === "1";
}

function isAdultCatalogCandidate(data: NonNullable<AppDetails["data"]>) {
  if (data.type !== "game" && data.type !== "demo") return false;
  const ids = data.content_descriptors?.ids ?? [];
  if (ids.includes(STEAM_DESCRIPTOR_ADULT_ONLY_SEXUAL)) return true;
  if (includeSexualDescriptor() && ids.includes(STEAM_DESCRIPTOR_SEXUAL)) return true;
  return false;
}

function platformsFromDetails(data: NonNullable<AppDetails["data"]>) {
  const p: string[] = [];
  if (data.platforms?.windows) p.push("windows");
  if (data.platforms?.mac) p.push("mac");
  if (data.platforms?.linux) p.push("linux");
  return p.length ? p : ["windows"];
}

function detailDelayMs() {
  return Number(process.env.STEAM_DETAIL_DELAY_MS ?? "280");
}

async function ingestFromAppIds(appIds: number[]) {
  let inserted = 0;
  let matched = 0;
  for (const appId of appIds) {
    const data = await fetchSteamAppDetails(appId);
    await sleep(detailDelayMs());
    if (!data?.name) continue;
    if (!isAdultCatalogCandidate(data)) continue;
    matched += 1;
    const platforms = platformsFromDetails(data);
    const tagList = extractSteamTags(data);
    const ok = await upsertCandidate({
      source: "steam",
      externalId: String(appId),
      title: data.name,
      outboundUrl: `https://store.steampowered.com/app/${appId}`,
      rawPayload: { platforms, appId, steam: data },
      tags: tagList,
    });
    if (ok) inserted += 1;
  }
  return { checked: appIds.length, matched, inserted };
}

async function discoverViaStoreSearch(terms: string[], perTerm: number) {
  const ids = new Set<number>();
  for (const term of terms) {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&count=${perTerm}&cc=us&l=english`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) continue;
    const json = await res.json();
    for (const item of json?.items ?? []) {
      if (item.id) ids.add(Number(item.id));
    }
    await sleep(Number(process.env.STEAM_SEARCH_DELAY_MS ?? "400"));
  }
  return [...ids];
}

async function loadSearchTerms(): Promise<string[]> {
  const env = process.env.STEAM_SEARCH_TERMS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (env?.length) return env;
  try {
    const raw = await readFile("data/steam-search-terms.json", "utf8");
    return JSON.parse(raw) as string[];
  } catch {
    return ["nsfw", "adult only", "visual novel", "dating sim"];
  }
}

async function fetchAppListDelta(key: string, maxApps: number) {
  let lastAppId = 0;
  const ifModifiedSince = Number(process.env.STEAM_IF_MODIFIED_SINCE ?? "0");
  const collected: number[] = [];

  while (collected.length < maxApps) {
    const params = new URLSearchParams({
      key,
      include_games: "true",
      include_dlc: "false",
      include_software: "false",
      include_videos: "false",
      include_hardware: "false",
      max_results: "500",
      last_appid: String(lastAppId),
      if_modified_since: String(ifModifiedSince),
    });
    const url = `https://api.steampowered.com/IStoreService/GetAppList/v1/?${params}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) break;
    const json = await res.json();
    const apps = json?.response?.apps ?? [];
    if (!apps.length) break;
    for (const a of apps) {
      if (a.appid) collected.push(Number(a.appid));
    }
    lastAppId = json?.response?.last_appid ?? lastAppId;
    if (!json?.response?.have_more) break;
    await sleep(500);
  }

  return collected.slice(0, maxApps);
}

async function discoverAppIds(key: string | undefined): Promise<number[]> {
  const idSet = new Set<number>();

  const envIds = process.env.STEAM_DEMO_APP_IDS?.split(",")
    .map((s) => Number(s.trim()))
    .filter(Boolean);
  for (const id of envIds ?? []) idSet.add(id);

  try {
    const raw = await readFile("data/steam-seed-appids.json", "utf8");
    for (const id of JSON.parse(raw) as number[]) idSet.add(id);
  } catch {
    /* optional */
  }

  const perTerm = Number(process.env.STEAM_SEARCH_PER_TERM ?? "50");
  const terms = await loadSearchTerms();
  for (const id of await discoverViaStoreSearch(terms, perTerm)) {
    idSet.add(id);
  }

  if (key && process.env.STEAM_USE_APPLIST_DELTA === "1") {
    const deltaIds = await fetchAppListDelta(
      key,
      Number(process.env.STEAM_APPLIST_DELTA_MAX ?? "2000"),
    );
    for (const id of deltaIds) idSet.add(id);
  }

  return [...idSet];
}

export async function runSteamIngest() {
  const key = process.env.STEAM_WEB_API_KEY;
  const maxCheck = Number(process.env.STEAM_INGEST_MAX_APPS ?? "250");

  const discovered = await discoverAppIds(key);
  const appIds = discovered.slice(0, maxCheck > 0 ? maxCheck : discovered.length);
  const stats = await ingestFromAppIds(appIds);
  const mode = key
    ? process.env.STEAM_USE_APPLIST_DELTA === "1"
      ? "search_plus_applist_delta"
      : "storesearch"
    : "storesearch_or_demo";

  await touchIngestSource("steam_app_delta", {
    mode,
    discovered: discovered.length,
    ...stats,
  });
  return { source: "steam", mode, discovered: discovered.length, ...stats };
}

async function cliMain() {
  console.log(JSON.stringify(await runSteamIngest()));
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("ingest-steam.ts");
if (isDirectRun) {
  cliMain().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
