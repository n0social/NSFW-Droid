import {
  allowedPublicPostHosts,
  isSameOriginPublicPost,
  publicRequestHost,
} from "../src/lib/public-post-csrf";

const problems: string[] = [];

function expect(name: string, actual: boolean, wanted: boolean) {
  if (actual !== wanted) problems.push(`${name}: got ${actual}, wanted ${wanted}`);
}

function req(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { method: "POST", headers });
}

expect(
  "origin matches host",
  isSameOriginPublicPost(
    req("https://www.nsfwdroid.com/api/newsletter/subscribe", {
      host: "www.nsfwdroid.com",
      origin: "https://www.nsfwdroid.com",
    }),
  ),
  true,
);

expect(
  "referer when origin omitted",
  isSameOriginPublicPost(
    req("https://www.nsfwdroid.com/api/submissions", {
      host: "www.nsfwdroid.com",
      referer: "https://www.nsfwdroid.com/submit",
    }),
  ),
  true,
);

expect(
  "localhost dev",
  isSameOriginPublicPost(
    req("http://localhost:3847/api/submissions", {
      host: "localhost:3847",
      origin: "http://localhost:3847",
    }),
  ),
  true,
);

expect(
  "cross-site origin",
  isSameOriginPublicPost(
    req("https://www.nsfwdroid.com/api/submissions", {
      host: "www.nsfwdroid.com",
      origin: "https://evil.example",
    }),
  ),
  false,
);

expect(
  "no origin or referer",
  isSameOriginPublicPost(
    req("https://www.nsfwdroid.com/api/submissions", {
      host: "www.nsfwdroid.com",
    }),
  ),
  false,
);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("ok");
