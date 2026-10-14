import "dotenv/config";
import { migrate } from "drizzle-orm/pglite/migrator";
import { db, pgliteClient } from "../src/db";
import { mkdir } from "fs/promises";

async function main() {
  await mkdir("data", { recursive: true });
  await migrate(db, { migrationsFolder: "./drizzle" });
  await pgliteClient.close();
  console.log("Migrations applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
