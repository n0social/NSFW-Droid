import "dotenv/config";
import { readFile } from "fs/promises";
import {
  USER_AGENT,
  upsertCandidate,
  touchIngestSource,
  sleep,
} from "./lib/ingest-common";

const STEAM_DESCRIPTOR_ADULT_ONLY_SEXUAL = 3;
const STEAM_DESCRIPTOR_SEXUAL = 1;

type AppDetails = {
  success: boolean;
  data?: {
    name?: string;
    type?: string; // game | demo
    content_descriptors?: { ids?: number[] };
    platforms?: { windows?: boolean; mac?: boolean; linux?: boolean };
  };
};

async function fetchSteamAppDetails(appId: number) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const json = await res.json();
  const block = json[String(appId)] as AppDetails | undefined;
  if (!block?.success || !block.data) return null;
  return block.data;
}

function isAdultCatalogCandidate(data: NonNullable<AppDetails["data"]>) {
  if (data.type !== "game" && data.type !== "demo") return false;
  const ids = data.content_descriptors?.ids ?? [];
  return ids.includes(STEAM_DESCRIPTOR_ADULT_ONLY_SEXUAL);
}

function platformsFromDetails(data: NonNullable<AppDetails["data"]>) {
  const p: string[] = [];
  if (data.platforms?.windows) p.push("windows");
  if (data.platforms?.mac) p.push("mac");
  if (data.platforms?.linux) p.push("linux");
  return p.length ? p : ["windows"];
}

async function ingestFromAppIds(appIds: number[]) {
  let inserted = 0;
  let matched = 0;
  for (const appId of appIds) {
    const data = await fetchSteamAppDetails(appId);
    await sleep(300);
    if (!data?.name) continue;
    if (!isAdultCatalogCandidate(data)) continue;
    matched += 1;
    const ok = await upsertCandidate({
      source: "steam",
      externalId: String(appId),
      title: data.name,
      outboundUrl: `https://store.steampowered.com/app/${appId}`,
      rawPayload: { platforms: platformsFromDetails(data), appId },
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
    await sleep(400);
  }
  return [...ids];
}

async function ingestFromWebApi(key: string, maxApps: number) {
  let lastAppId = 0;
  const ifModifiedSince = 0;
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
    if (!res.ok) throw new Error(`Steam GetAppList HTTP ${res.status}`);
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

  return ingestFromAppIds(collected.slice(0, maxApps));
}

export async function runSteamIngest() {
  const key = process.env.STEAM_WEB_API_KEY;
  const maxCheck = Number(process.env.STEAM_INGEST_MAX_APPS ?? "60");

  let stats: { checked: number; matched: number; inserted: number };
  let mode: string;

  if (key) {
    stats = await ingestFromWebApi(key, maxCheck);
    mode = "web_api";
  } else {
    const envIds = process.env.STEAM_DEMO_APP_IDS?.split(",")
      .map((s) => Number(s.trim()))
      .filter(Boolean);
    const idSet = new Set<number>(envIds ?? []);
    try {
      const raw = await readFile("data/steam-seed-appids.json", "utf8");
      for (const id of JSON.parse(raw) as number[]) idSet.add(id);
    } catch {
      /* optional seed file */
    }
    for (const id of await discoverViaStoreSearch(
      [
        "hunie",
        "succubus",
        "dating sim",
        "visual novel",
        "waifu",
        "adult only",
        "lovecraft fallen doll",
      ],
      12,
    )) {
      idSet.add(id);
    }
    const appIds = [...idSet].slice(0, maxCheck);
    stats = await ingestFromAppIds(appIds);
    mode = "storesearch_or_demo";
  }

  await touchIngestSource("steam_app_delta", { mode, ...stats });
  return { source: "steam", mode, ...stats };
}

async function main() {
  console.log(JSON.stringify(await runSteamIngest()));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
