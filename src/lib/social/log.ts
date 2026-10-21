import { appendFileSync } from "node:fs";

export function socialLogPath(): string {
  const raw = process.env.NSFWDROID_SOCIAL_LOG?.trim();
  if (raw) return raw;
  return "/var/log/nsfwdroid-social.log";
}

export function appendSocialLog(entry: Record<string, unknown>): void {
  const line = `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`;
  try {
    appendFileSync(socialLogPath(), line, { encoding: "utf8" });
  } catch {
    console.error(line.trimEnd());
  }
}
