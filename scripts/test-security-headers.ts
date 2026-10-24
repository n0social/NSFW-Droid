import assert from "node:assert/strict";
import { applySecurityHeaders } from "../src/lib/security-headers";

function mockRequest(proto: string) {
  return {
    headers: new Headers({ "x-forwarded-proto": proto }),
    nextUrl: { protocol: "https:" },
  } as import("next/server").NextRequest;
}

const res = new Response(null, { status: 200 });
applySecurityHeaders(mockRequest("https"), res);

assert.equal(res.headers.get("X-Content-Type-Options"), "nosniff");
assert.equal(res.headers.get("X-Frame-Options"), "SAMEORIGIN");
assert.match(res.headers.get("Strict-Transport-Security") ?? "", /max-age=31536000/);

const httpRes = new Response(null);
applySecurityHeaders(mockRequest("http"), httpRes);
assert.equal(httpRes.headers.get("Strict-Transport-Security"), null);

console.log("test-security-headers: ok");
