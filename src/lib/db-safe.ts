import type { CatalogDb } from "@/db";
import { checkCatalogDbHealth, getCatalogDbLastError, getDb } from "@/db";

export type SafeQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; data: T; error: string };

function formatDbError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Run a catalog query without throwing — logs server-side and returns fallback on failure.
 */
export async function safeCatalogQuery<T>(
  label: string,
  fallback: T,
  fn: (db: CatalogDb) => Promise<T>,
): Promise<SafeQueryResult<T>> {
  try {
    const db = await getDb();
    const data = await fn(db);
    return { ok: true, data };
  } catch (err) {
    const message = formatDbError(err);
    console.error(`[catalog-db] ${label}:`, err);
    return { ok: false, data: fallback, error: message };
  }
}

export async function catalogHealthSnapshot(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  const healthy = await checkCatalogDbHealth();
  if (healthy) return { healthy: true };
  const last = getCatalogDbLastError();
  return { healthy: false, error: last?.message ?? "catalog database unavailable" };
}
