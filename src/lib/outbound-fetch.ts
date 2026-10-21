import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  isPrivateOrMetadataIp,
  isSafeOutboundFetchUrl,
  outboundFetchBlockReason,
} from "@/lib/outbound-link";

const MAX_REDIRECTS = 5;

async function assertResolvableOutboundHost(hostname: string): Promise<void> {
  const host = hostname.trim().toLowerCase();
  if (isIP(host)) {
    if (isPrivateOrMetadataIp(host)) {
      throw new Error("cover_fetch_blocked:private_ip");
    }
    return;
  }

  const records = await lookup(host, { all: true, verbatim: true });
  if (!records.length) {
    throw new Error("cover_fetch_blocked:dns");
  }
  for (const record of records) {
    if (isPrivateOrMetadataIp(record.address)) {
      throw new Error("cover_fetch_blocked:private_ip");
    }
  }
}

async function assertSafeOutboundFetchTarget(url: string): Promise<void> {
  const reason = outboundFetchBlockReason(url);
  if (reason) {
    throw new Error(`cover_fetch_blocked:${reason}`);
  }
  const u = new URL(url.trim());
  await assertResolvableOutboundHost(u.hostname);
}

function mergeInit(init?: RequestInit): RequestInit {
  return {
    ...init,
    redirect: "manual",
  };
}

/**
 * Fetch an http(s) URL with SSRF guards: block private/metadata targets and re-check each redirect hop.
 */
export async function fetchSafeOutboundUrl(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  let current = url.trim();
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isSafeOutboundFetchUrl(current)) {
      const reason = outboundFetchBlockReason(current) ?? "invalid_url";
      throw new Error(`cover_fetch_blocked:${reason}`);
    }
    await assertSafeOutboundFetchTarget(current);

    const res = await fetch(current, mergeInit(init));
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) {
        throw new Error(`cover_fetch_failed:${res.status}`);
      }
      current = new URL(location, current).toString();
      continue;
    }
    return res;
  }
  throw new Error("cover_fetch_blocked:redirect_limit");
}
