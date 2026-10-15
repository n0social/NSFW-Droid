import { access } from "fs/promises";
import path from "path";

const DEFAULT_RELATIVE = "data/affiliate-export.json";

/** Run affiliate file ingest when AFFILIATE_EXPORT_PATH is set or the default export file exists. */
export async function resolveAffiliateExportPath(): Promise<string | null> {
  const fromEnv = process.env.AFFILIATE_EXPORT_PATH?.trim();
  if (fromEnv) return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);

  const defaultPath = path.join(process.cwd(), DEFAULT_RELATIVE);
  try {
    await access(defaultPath);
    return defaultPath;
  } catch {
    return null;
  }
}
