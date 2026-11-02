/**
 * Documents and asserts the browser popunder chain:
 * 1) current tab location.assign → /api/go or the outbound URL (one store navigation)
 * 2) hidden iframe → /api/ads/popunder-launch?hop=syndication → 302 → s.pemsrv.com link.php
 *
 * The catalog must not window.open the store. link.php may open its own ad tab.
 * A Node fetch of s.pemsrv.com does not bill and must not be wired into /api/go or /api/outbound.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  buildExoclickPopunderClickUrl,
  EXOCLICK_POPUNDER_REFERRER_HOME,
  EXOCLICK_SYNDICATION_HOST,
} from "../src/lib/exoclick-popunder-syndication";

const zoneId = "6062592";
const syndicationUrl = buildExoclickPopunderClickUrl(zoneId, EXOCLICK_POPUNDER_REFERRER_HOME);

assert.ok(syndicationUrl.includes(`https://${EXOCLICK_SYNDICATION_HOST}/v1/link.php`));
assert.ok(syndicationUrl.includes(`idzone=${zoneId}`));

const launch = new URL("/api/ads/popunder-launch", "https://www.nsfwdroid.com");
launch.searchParams.set("p", EXOCLICK_POPUNDER_REFERRER_HOME);
launch.searchParams.set("hop", "syndication");
assert.equal(launch.searchParams.get("hop"), "syndication");

const client = readFileSync("src/lib/exoclick-play-popunder-client.ts", "utf8");
assert.match(client, /createElement\("iframe"\)/);
assert.match(client, /hop", "syndication"/);
assert.match(client, /location\.assign/);
assert.match(client, /does not bill/);
assert.doesNotMatch(client, /\bfetch\s*\(/);
assert.doesNotMatch(client, /window\.open\s*\(/);

const go = readFileSync("src/app/api/go/[listingId]/route.ts", "utf8");
assert.match(go, /does not bill/);
assert.doesNotMatch(go, /scheduleExoclickPopunderSyndicationHit/);
assert.doesNotMatch(go, /\bfetch\s*\(/);

const outbound = readFileSync("src/app/api/outbound/route.ts", "utf8");
assert.match(outbound, /does not bill/);
assert.doesNotMatch(outbound, /scheduleExoclickPopunderSyndicationHit/);
assert.doesNotMatch(outbound, /fetch\s*\(/);

assert.equal(existsSync("src/lib/exoclick-popunder-server.ts"), false);
assert.equal(existsSync("src/lib/exoclick-go-interstitial.ts"), false);

const play = readFileSync("src/components/OutboundPlayLink.tsx", "utf8");
assert.match(play, /listingEligibleForPlayPopunder/);
assert.match(play, /firePlayStorePopunder/);
assert.doesNotMatch(play, /window\.open\s*\(/);
assert.doesNotMatch(play, /openOutboundInNewTab/);
assert.match(play, /<a className=\{className\} href=\{href\}/);

const pop = readFileSync("src/components/OutboundPopunderLink.tsx", "utf8");
assert.match(pop, /firePopunderThenNavigate/);
assert.doesNotMatch(pop, /firePopunderThenOpenNewTab/);
assert.doesNotMatch(pop, /window\.open\s*\(/);
assert.doesNotMatch(pop, /openOutboundInNewTab/);

type FakeIframe = {
  src: string;
  style: { cssText?: string };
  title: string;
  listeners: Record<string, Array<() => void>>;
  crossOrigin: boolean;
  setAttribute: () => void;
  addEventListener: (type: string, fn: () => void) => void;
  remove: () => void;
};

const iframes: FakeIframe[] = [];
const assigns: string[] = [];
const opened: string[] = [];
const timers: Array<{ ms: number; fn: () => void }> = [];

const storage = new Map<string, string>();

function installGlobal(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

installGlobal("window", {
    location: {
      origin: "https://www.nsfwdroid.com",
      assign(url: string) {
        assigns.push(url);
      },
    },
    open(url: string) {
      opened.push(url);
      return { focus() {} };
    },
    setTimeout(fn: () => void, ms?: number) {
      timers.push({ ms: ms ?? 0, fn });
      return timers.length;
    },
    focus() {},
  });
installGlobal("document", {
    body: {
      appendChild(node: FakeIframe) {
        iframes.push(node);
        return node;
      },
    },
    createElement() {
      const iframe: FakeIframe = {
        src: "",
        style: {},
        title: "",
        listeners: {},
        crossOrigin: true,
        setAttribute() {},
        addEventListener(type: string, fn: () => void) {
          (iframe.listeners[type] ??= []).push(fn);
        },
        remove() {},
      };
      Object.defineProperty(iframe, "contentWindow", {
        configurable: true,
        get() {
          if (iframe.crossOrigin) throw new Error("cross-origin");
          return { location: { href: "about:blank" } };
        },
      });
      return iframe;
    },
  });
installGlobal("localStorage", {
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  });

process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER = zoneId;
delete process.env.NEXT_PUBLIC_EXOCLICK_POPUNDER_FREQUENCY_MINUTES;

async function assertClickBehavior(): Promise<void> {
  const { firePlayStorePopunder, firePopunderThenNavigate } = await import(
    "../src/lib/exoclick-play-popunder-client"
  );

  const goHref = "https://www.nsfwdroid.com/api/go/listing-1";
  assert.equal(firePlayStorePopunder(goHref), true);
  assert.equal(opened.length, 0, "play click must not window.open");
  assert.equal(assigns.length, 0, "current tab waits until the iframe hop is underway");
  assert.equal(iframes.length, 1);
  assert.match(iframes[0].src, /\/api\/ads\/popunder-launch\?/);
  assert.match(iframes[0].src, /hop=syndication/);
  assert.match(iframes[0].src, /p=/);

  iframes[0].crossOrigin = false;
  for (const fn of iframes[0].listeners.load ?? []) fn();
  assert.equal(assigns.length, 0, "about:blank load must not leave the catalog yet");

  iframes[0].crossOrigin = true;
  for (const fn of iframes[0].listeners.load ?? []) fn();
  assert.deepEqual(assigns, [goHref]);

  const fallback = timers.find((timer) => timer.ms === 1_200);
  assert.ok(fallback, "missing hop fallback timer");
  fallback.fn();
  assert.deepEqual(assigns, [goHref], "fallback must not assign a second navigation");
  assert.equal(opened.length, 0);

  assigns.length = 0;
  timers.length = 0;
  assert.equal(firePlayStorePopunder(""), false);
  assert.equal(iframes.length, 1);
  assert.equal(assigns.length, 0);

  const outboundHref = "https://creator.itch.io/my-game";
  assert.equal(firePopunderThenNavigate(outboundHref), true);
  assert.equal(iframes.length, 2);
  assert.equal(assigns.length, 0);
  const outboundFallback = timers.find((timer) => timer.ms === 1_200);
  assert.ok(outboundFallback);
  outboundFallback.fn();
  assert.deepEqual(assigns, [outboundHref]);
  assert.equal(opened.length, 0);

  assigns.length = 0;
  iframes.length = 0;
  process.env.NEXT_PUBLIC_EXOCLICK_POPUNDER_FREQUENCY_MINUTES = "30";
  storage.set(`nsfwdroid-exo-pop-${zoneId}`, String(Date.now()));
  assert.equal(firePlayStorePopunder(goHref), true);
  assert.equal(iframes.length, 0, "capped clicks skip the iframe");
  assert.deepEqual(assigns, [goHref]);
  assert.equal(opened.length, 0);

  storage.clear();
  delete process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER;
  delete process.env.NEXT_PUBLIC_EXOCLICK_POPUNDER_FREQUENCY_MINUTES;
  assigns.length = 0;
  assert.equal(firePlayStorePopunder(goHref), true);
  assert.equal(iframes.length, 0, "missing zone skips the iframe");
  assert.deepEqual(assigns, [goHref]);
  assert.equal(opened.length, 0);
}

assertClickBehavior()
  .then(() => {
    console.log("test-exoclick-popunder-workflow: ok");
    console.log("  current tab: /api/go/{listingId} via location.assign");
    console.log("  iframe src:", launch.pathname + "?" + launch.searchParams.toString());
    console.log("  launch 302 →", syndicationUrl.slice(0, 72) + "...");
    console.log("  window.open count: 0");
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
