import { readFile } from "node:fs/promises";
import path from "node:path";

export type MaintenanceNotice = {
  active: boolean;
  until: string | null;
  message: string | null;
  windowStart: string | null;
};

const DEFAULT_MESSAGE =
  "Scheduled maintenance today 03:00–04:00 UTC. The site may be unavailable during that window.";

type NoticeFile = {
  until?: string;
  message?: string;
  windowStart?: string;
};

function parseIsoMs(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const ms = Date.parse(value.trim());
  return Number.isFinite(ms) ? ms : null;
}

async function readNoticeFile(): Promise<NoticeFile | null> {
  const filePath = path.join(process.cwd(), "data", "maintenance-notice.json");
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as NoticeFile;
  } catch {
    return null;
  }
}

/** Upcoming or in-progress maintenance banner (file from cron or MAINTENANCE_NOTICE_UNTIL env). */
export async function getMaintenanceNotice(): Promise<MaintenanceNotice> {
  const fromFile = await readNoticeFile();
  const until =
    fromFile?.until?.trim() || process.env.MAINTENANCE_NOTICE_UNTIL?.trim() || null;
  const untilMs = parseIsoMs(until);
  if (untilMs === null) {
    return { active: false, until: null, message: null, windowStart: null };
  }

  const now = Date.now();
  if (now >= untilMs) {
    return { active: false, until, message: null, windowStart: null };
  }

  const windowStart =
    fromFile?.windowStart?.trim() || process.env.MAINTENANCE_WINDOW_START?.trim() || null;
  const message =
    fromFile?.message?.trim() || process.env.MAINTENANCE_NOTICE_MESSAGE?.trim() || DEFAULT_MESSAGE;

  return { active: true, until, message, windowStart };
}
