import "dotenv/config";
import { autoPublishDemo } from "./lib/ingest-common";
import { runItchIngest } from "./ingest-itch";
import { runSteamIngest } from "./ingest-steam";

async function main() {
  const itch = await runItchIngest();
  const steam = await runSteamIngest();
  const autoPublished = await autoPublishDemo(100);

  console.log(JSON.stringify({ itch, steam, autoPublished }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
