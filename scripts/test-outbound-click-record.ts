import {
  isLikelyBotUserAgent,
  shouldRecordOutboundClick,
} from "../src/lib/analytics-quality";

const page = "https://www.nsfwdroid.com/api/go/abc";
const problems: string[] = [];

function expect(name: string, actual: boolean, wanted: boolean) {
  if (actual !== wanted) problems.push(`${name}: got ${actual}, wanted ${wanted}`);
}

expect(
  "age-verified homepage play",
  shouldRecordOutboundClick({
    requestUrl: page,
    referrer: "https://www.nsfwdroid.com/",
    ageVerified: true,
  }),
  true,
);

expect(
  "browse play",
  shouldRecordOutboundClick({
    requestUrl: page,
    referrer: "https://www.nsfwdroid.com/browse",
    ageVerified: true,
  }),
  true,
);

expect(
  "crawler without cookie",
  shouldRecordOutboundClick({
    requestUrl: page,
    referrer: "https://www.nsfwdroid.com/",
    ageVerified: false,
  }),
  false,
);

expect(
  "no referrer",
  shouldRecordOutboundClick({
    requestUrl: page,
    referrer: null,
    ageVerified: true,
  }),
  false,
);

expect(
  "admin title link",
  shouldRecordOutboundClick({
    requestUrl: page,
    referrer: "https://www.nsfwdroid.com/admin",
    ageVerified: true,
  }),
  false,
);

expect(
  "admin subpage",
  shouldRecordOutboundClick({
    requestUrl: page,
    referrer: "https://nsfwdroid.com/admin/traffic",
    ageVerified: true,
  }),
  false,
);

expect(
  "other host",
  shouldRecordOutboundClick({
    requestUrl: page,
    referrer: "https://example.com/",
    ageVerified: true,
  }),
  false,
);

expect(
  "proxy internal request url, public host header",
  shouldRecordOutboundClick({
    requestUrl: "http://127.0.0.1:3000/api/go/abc",
    siteHost: "www.nsfwdroid.com",
    referrer: "https://www.nsfwdroid.com/browse",
    ageVerified: true,
  }),
  true,
);

expect(
  "forwarded host list uses the first host",
  shouldRecordOutboundClick({
    requestUrl: "http://127.0.0.1:3000/api/go/abc",
    siteHost: "www.nsfwdroid.com, nsfwdroid.com",
    referrer: "https://www.nsfwdroid.com/",
    ageVerified: true,
  }),
  true,
);

expect(
  "catalog bot user-agent",
  shouldRecordOutboundClick({
    requestUrl: page,
    referrer: "https://www.nsfwdroid.com/",
    ageVerified: true,
    userAgent: "NSFW-Droid-Catalog/0.1",
  }),
  false,
);

expect(
  "internal probe header",
  shouldRecordOutboundClick({
    requestUrl: page,
    referrer: "https://www.nsfwdroid.com/",
    ageVerified: true,
    userAgent: "Mozilla/5.0",
    internalRequest: true,
  }),
  false,
);

expect(
  "admin session QA",
  shouldRecordOutboundClick({
    requestUrl: page,
    referrer: "https://www.nsfwdroid.com/browse",
    ageVerified: true,
    userAgent: "Mozilla/5.0",
    adminSession: true,
  }),
  false,
);

if (isLikelyBotUserAgent("curl/8.5.0") !== true) {
  problems.push("curl should be bot");
}
if (isLikelyBotUserAgent("Mozilla/5.0 (Windows NT 10.0)") !== false) {
  problems.push("chrome should not be bot");
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("ok");
