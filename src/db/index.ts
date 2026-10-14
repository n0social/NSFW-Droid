import { mkdirSync } from "fs";
import path from "path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const DATA_DIR = path.resolve(
  process.cwd(),
  process.env.PGLITE_DATA_DIR ?? "data/catalog",
);

export type CatalogDb = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __catalogPglite: PGlite | undefined;
  var __catalogDb: CatalogDb | undefined;
  var __catalogDbInitFlight: Promise<CatalogDb> | undefined;
  var __catalogDbLastError: Error | undefined;
  var __catalogDbHealthy: boolean | undefined;
}

/**
 * PGlite must not be opened while the Next.js server holds the same data dir.
 * Stop `nsfwdroid` before ingest/migrate (see docs/deploy-droplet.md §5).
 */
function createClient(): PGlite {
  mkdirSync(path.dirname(DATA_DIR), { recursive: true });
  mkdirSync(DATA_DIR, { recursive: true });
  return new PGlite(DATA_DIR);
}

async function openCatalogDb(): Promise<CatalogDb> {
  const client = global.__catalogPglite ?? createClient();
  if (!global.__catalogPglite) global.__catalogPglite = client;

  await client.waitReady;

  const db = global.__catalogDb ?? drizzle(client, { schema });
  if (!global.__catalogDb) global.__catalogDb = db;

  await db.execute(sql`select 1`);
  global.__catalogDbHealthy = true;
  global.__catalogDbLastError = undefined;
  return db;
}

/**
 * Lazy, single-flight catalog DB access. Safe to call from RSC and route handlers.
 */
export async function getDb(): Promise<CatalogDb> {
  if (global.__catalogDb && global.__catalogDbHealthy) {
    return global.__catalogDb;
  }
  if (global.__catalogDbInitFlight) {
    return global.__catalogDbInitFlight;
  }

  global.__catalogDbInitFlight = openCatalogDb()
    .catch((err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      global.__catalogDbLastError = error;
      global.__catalogDbHealthy = false;
      throw error;
    })
    .finally(() => {
      global.__catalogDbInitFlight = undefined;
    });

  return global.__catalogDbInitFlight;
}

/** True only after a successful `select 1` during init or health check. */
export function isCatalogDbHealthy(): boolean {
  return Boolean(global.__catalogDbHealthy && global.__catalogDb);
}

export function getCatalogDbLastError(): Error | undefined {
  return global.__catalogDbLastError;
}

/** Ping the catalog DB; updates healthy flag. */
export async function checkCatalogDbHealth(): Promise<boolean> {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    global.__catalogDbHealthy = true;
    return true;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    global.__catalogDbLastError = error;
    global.__catalogDbHealthy = false;
    return false;
  }
}

export async function getPgliteClient(): Promise<PGlite> {
  await getDb();
  if (!global.__catalogPglite) {
    throw new Error("PGlite client not initialized");
  }
  return global.__catalogPglite;
}

/** Close catalog DB (ingest/migrate scripts — not used by the web server). */
export async function closeCatalogDb(): Promise<void> {
  const client = global.__catalogPglite;
  global.__catalogPglite = undefined;
  global.__catalogDb = undefined;
  global.__catalogDbHealthy = false;
  global.__catalogDbInitFlight = undefined;
  if (client) {
    await client.close();
  }
}
