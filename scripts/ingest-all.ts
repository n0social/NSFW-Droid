import "dotenv/config";
import { autoPublishPendingCandidates } from "../src/lib/auto-publish";
import { runItchIngest } from "./ingest-itch";
import { runSteamIngest } from "./ingest-steam";

async function main() {
  const itch = await runItchIngest();
  const steam = await runSteamIngest();
  const autoPublished = await autoPublishPendingCandidates(
    Number(process.env.INGEST_AUTO_PUBLISH_LIMIT ?? "500"),
  );

  console.log(JSON.stringify({ itch, steam, autoPublished }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
