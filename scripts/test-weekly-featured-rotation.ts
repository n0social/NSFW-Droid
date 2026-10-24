import assert from "node:assert/strict";
import {
  formatCurrentIsoWeekRangeLabel,
  formatPreviousWeekRangeLabel,
  previousWeekFavoriteWindow,
} from "../src/lib/catalog-week";

const tz = "America/New_York";

const mon1 = new Date("2026-10-19T12:00:00-04:00");
const fri1 = new Date("2026-10-24T12:00:00-04:00");
const mon2 = new Date("2026-10-26T12:00:00-04:00");

const prevForMon1 = previousWeekFavoriteWindow(mon1, tz);
const prevForFri1 = previousWeekFavoriteWindow(fri1, tz);
const prevForMon2 = previousWeekFavoriteWindow(mon2, tz);

assert.equal(
  prevForMon1.statsStart.getTime(),
  prevForFri1.statsStart.getTime(),
  "same display week → same previous-week source window",
);
assert.notEqual(
  prevForMon1.statsStart.getTime(),
  prevForMon2.statsStart.getTime(),
  "new display week → previous-week window advances",
);

const weekMs = 7 * 24 * 60 * 60 * 1000;
assert.equal(prevForMon1.statsEnd.getTime() - prevForMon1.statsStart.getTime(), weekMs);
assert.equal(prevForMon1.statsEnd.getTime(), new Date("2026-10-19T04:00:00.000Z").getTime());

const label = formatCurrentIsoWeekRangeLabel(mon1, tz);
assert.match(label, /Oct/);

const additionsLabel = formatPreviousWeekRangeLabel(prevForMon1);
assert.match(additionsLabel, /Oct/);

console.log("test-weekly-featured-rotation: ok", {
  featuredWeek: label,
  sourceWeek: additionsLabel,
});
