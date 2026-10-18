import { TOP_SFM_MODELS } from "../src/lib/sfm-models-curated";
import { USER_AGENT } from "./lib/ingest-common";

async function main() {
  for (const m of TOP_SFM_MODELS) {
    const url = `https://smutba.se/project/${m.projectId}/`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "manual" });
    const loc = res.headers.get("location") ?? res.url;
    const follow = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
    const html = await follow.text();
    const og = html.match(/property="og:title"\s+content="([^"]+)"/i)?.[1];
    const onSmut = follow.url.includes("smutba.se");
    console.log(
      `${m.id}\tonSmut:${onSmut}\t${og}\tmanual:${res.status} ${loc}\tfinal:${follow.url}`,
    );
    await new Promise((r) => setTimeout(r, 350));
  }
}

main();
