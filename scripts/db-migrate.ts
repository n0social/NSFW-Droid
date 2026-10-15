import "dotenv/config";
import { mkdir } from "fs/promises";
import path from "path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const DATA_DIR = path.resolve(
  process.cwd(),
  process.env.PGLITE_DATA_DIR ?? "data/catalog",
);

async function main() {
  await mkdir(path.dirname(DATA_DIR), { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });

  const client = new PGlite(DATA_DIR);
  await client.waitReady;
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await client.close();
  console.log("Migrations applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
