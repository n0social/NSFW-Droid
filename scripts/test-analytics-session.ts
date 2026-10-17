import { analyticsSessionIdFromCookie, createAnalyticsSessionId } from "../src/lib/analytics-session";
import { linkProbeIsInconclusive } from "./check-listing-links";

const problems: string[] = [];
const id = createAnalyticsSessionId();
if (!/^[a-f0-9]{32}$/.test(id)) problems.push(`session id ${id}`);
if (analyticsSessionIdFromCookie(id) !== id) problems.push("roundtrip");
if (analyticsSessionIdFromCookie("1") !== null) problems.push("rejected short");
if (analyticsSessionIdFromCookie(undefined) !== null) problems.push("rejected empty");
if (!linkProbeIsInconclusive(403) || !linkProbeIsInconclusive(429)) problems.push("inconclusive");
if (linkProbeIsInconclusive(404) || linkProbeIsInconclusive(200)) problems.push("conclusive");

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("ok");
