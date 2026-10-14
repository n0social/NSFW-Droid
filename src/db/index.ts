import { mkdirSync } from "fs";
import { dirname } from "path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";

const DATA_DIR = process.env.PGLITE_DATA_DIR ?? "data/catalog";

declare global {
  var __catalogPglite: PGlite | undefined;
  var __catalogDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function createClient() {
  mkdirSync(dirname(DATA_DIR), { recursive: true });
  return new PGlite(DATA_DIR);
}

const client = global.__catalogPglite ?? createClient();
if (!global.__catalogPglite) global.__catalogPglite = client;

export const db = global.__catalogDb ?? drizzle(client, { schema });
if (!global.__catalogDb) global.__catalogDb = db;

export { client as pgliteClient };
