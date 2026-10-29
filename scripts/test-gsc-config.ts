import assert from "node:assert/strict";
import { gscDateRange } from "../src/lib/gsc-api";
import {
  getGscConfigStatus,
  getGscPropertyUrl,
  gscWindowDays,
  parseGscServiceAccount,
} from "../src/lib/gsc-config";

function withEnv(key: string, value: string | undefined, fn: () => void) {
  const prev = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
  try {
    fn();
  } finally {
    if (prev === undefined) delete process.env[key];
    else process.env[key] = prev;
  }
}

withEnv("GSC_SERVICE_ACCOUNT_JSON", undefined, () => {
  const status = getGscConfigStatus();
  assert.equal(status.configured, false);
  if (!status.configured) {
    assert(status.missing.includes("GSC_SERVICE_ACCOUNT_JSON"));
  }
});

withEnv(
  "GSC_SERVICE_ACCOUNT_JSON",
  JSON.stringify({
    type: "service_account",
    client_email: "gsc@test.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----\n",
  }),
  () => {
    assert(parseGscServiceAccount()?.client_email?.includes("gsc@test"));
    const status = getGscConfigStatus();
    assert.equal(status.configured, true);
    if (status.configured) {
      assert(status.propertyUrl.endsWith("/"));
    }
  },
);

withEnv("GSC_PROPERTY_URL", "https://example.com", () => {
  assert.equal(getGscPropertyUrl(), "https://example.com/");
});

withEnv("GSC_WINDOW_DAYS", "45", () => {
  assert.equal(gscWindowDays(), 45);
});

const range = gscDateRange(7);
assert.match(range.startDate, /^\d{4}-\d{2}-\d{2}$/);
assert.match(range.endDate, /^\d{4}-\d{2}-\d{2}$/);
assert(range.startDate <= range.endDate);

console.log("test-gsc-config: ok");
