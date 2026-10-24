import assert from "node:assert/strict";
import {
  formatCurrentIsoWeekRangeLabel,
  previousWeekFavoriteWindow,
} from "../src/lib/catalog-week";
import { weeklyFeaturedRotationIndex } from "../src/lib/weekly-featured-rotation";

const tz = "America/New_York";
const pool = 100;

const mon1 = new Date("2026-10-19T12:00:00-04:00");
const fri1 = new Date("2026-10-24T12:00:00-04:00");
const mon2 = new Date("2026-10-26T12:00:00-04:00");

const idxMon1 = weeklyFeaturedRotationIndex(mon1, pool, tz);
const idxFri1 = weeklyFeaturedRotationIndex(fri1, pool, tz);
const idxMon2 = weeklyFeaturedRotationIndex(mon2, pool, tz);

assert.equal(idxMon1, idxFri1, "same ISO week → same rotation index");
assert.notEqual(idxMon1, idxMon2, "new week → different index (for pool > 1)");

const label = formatCurrentIsoWeekRangeLabel(mon1, tz);
assert.match(label, /Oct/);

const prevWeek = previousWeekFavoriteWindow(mon1, tz);
const weekMs = 7 * 24 * 60 * 60 * 1000;
assert.equal(prevWeek.statsEnd.getTime() - prevWeek.statsStart.getTime(), weekMs);
assert.equal(prevWeek.statsEnd.getTime(), new Date("2026-10-19T04:00:00.000Z").getTime());

console.log("test-weekly-featured-rotation: ok", { idxMon1, idxMon2, label });
