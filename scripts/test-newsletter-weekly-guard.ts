import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  recordWeeklySendCompleted,
  shouldSkipWeeklySendBecauseAlreadySent,
  weeklySendWeekKey,
} from "../src/lib/newsletter/weekly-send-guard";

const weekKey = weeklySendWeekKey(new Date("2026-10-23T21:00:00-04:00"), "America/New_York");
const dir = mkdtempSync(join(tmpdir(), "nl-guard-"));
process.env.NEWSLETTER_WEEKLY_SEND_STATE = join(dir, "state.json");
recordWeeklySendCompleted({ weekKey, subscriberCount: 1, sent: 1, failed: 0, subject: "t" });
assert.equal(shouldSkipWeeklySendBecauseAlreadySent(weekKey, false).skip, true);
rmSync(dir, { recursive: true, force: true });
console.log("test-newsletter-weekly-guard: ok");
