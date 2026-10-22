import assert from "node:assert/strict";
import {
  formatPreviousWeekRangeLabel,
  previousWeekFavoriteWindow,
  startOfIsoWeekInTimeZone,
} from "../src/lib/catalog-week";

const tz = "America/New_York";
// Thu Oct 22, 2026 afternoon ET
const now = new Date("2026-10-22T16:00:00-04:00");
const weekStart = startOfIsoWeekInTimeZone(now, tz);
assert.equal(weekStart.toISOString(), "2026-10-19T04:00:00.000Z"); // Mon Oct 19 00:00 EDT (week of Thu Oct 22)

const win = previousWeekFavoriteWindow(now, tz);
assert.equal(win.statsEnd.toISOString(), weekStart.toISOString());
assert.equal(
  win.statsStart.toISOString(),
  new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
);

const label = formatPreviousWeekRangeLabel(win);
assert.match(label, /Oct/);

console.log("test-catalog-week: ok", label);
