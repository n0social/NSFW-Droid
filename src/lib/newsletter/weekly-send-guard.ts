import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type WeeklySendGuardRecord = {
  weekKey: string;
  completedAt: string;
  subscriberCount: number;
  sent: number;
  failed: number;
  subject: string;
};

const DEFAULT_TZ = "America/New_York";

export function weeklySendWeekKey(
  date: Date = new Date(),
  timeZone: string = process.env.NEWSLETTER_WEEKLY_TZ?.trim() || DEFAULT_TZ,
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? "0");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "1");
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "1");
  const target = new Date(Date.UTC(year, month - 1, day));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function weeklySendGuardPath(): string {
  const fromEnv = process.env.NEWSLETTER_WEEKLY_SEND_STATE?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    return "/var/lib/nsfwdroid/newsletter-weekly-send.json";
  }
  return "data/.newsletter-weekly-send.json";
}

function readGuardFile(path: string): WeeklySendGuardRecord | null {
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as WeeklySendGuardRecord;
    if (!parsed?.weekKey || !parsed.completedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function shouldSkipWeeklySendBecauseAlreadySent(
  weekKey: string,
  forceResend: boolean,
): { skip: boolean; record: WeeklySendGuardRecord | null } {
  if (forceResend) return { skip: false, record: null };
  const record = readGuardFile(weeklySendGuardPath());
  if (!record || record.weekKey !== weekKey) return { skip: false, record: null };
  return { skip: true, record };
}

export function recordWeeklySendCompleted(input: {
  weekKey: string;
  subscriberCount: number;
  sent: number;
  failed: number;
  subject: string;
}): void {
  const path = weeklySendGuardPath();
  mkdirSync(dirname(path), { recursive: true });
  const record: WeeklySendGuardRecord = {
    weekKey: input.weekKey,
    completedAt: new Date().toISOString(),
    subscriberCount: input.subscriberCount,
    sent: input.sent,
    failed: input.failed,
    subject: input.subject,
  };
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  renameSync(tmp, path);
}
