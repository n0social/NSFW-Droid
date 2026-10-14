import "dotenv/config";
import { migrate } from "drizzle-orm/pglite/migrator";
import { closeCatalogDb, getDb, getPgliteClient } from "../src/db";
import { mkdir } from "fs/promises";

async function main() {
  await mkdir("data", { recursive: true });
  const db = await getDb();
  await migrate(db, { migrationsFolder: "./drizzle" });
  const pgliteClient = await getPgliteClient();
  await pgliteClient.close();
  await closeCatalogDb();
  console.log("Migrations applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
