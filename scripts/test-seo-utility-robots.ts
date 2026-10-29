import robots from "../src/app/robots";
import { catalogRobotsAllow, catalogRobotsDisallow } from "../src/lib/robots-paths";
import { privatePageRobots } from "../src/lib/seo-private";

type RuleBlock = {
  allow?: string | string[];
  disallow?: string | string[];
  userAgent?: string | string[];
};

function normalizeList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function rulesList(): RuleBlock[] {
  const rules = robots().rules;
  if (!rules) return [];
  return Array.isArray(rules) ? rules : [rules];
}

function ruleForUserAgent(target: string): RuleBlock | undefined {
  return rulesList().find((rule) => {
    const agents = normalizeList(rule.userAgent);
    return agents.some((ua) => ua.toLowerCase() === target.toLowerCase());
  });
}

function assertPaths(label: string, rule: RuleBlock | undefined, kind: "allow" | "disallow", required: readonly string[]) {
  const paths = normalizeList(rule?.[kind]);
  const missing = required.filter((path) => !paths.includes(path));
  if (missing.length > 0) {
    console.error(`${label} missing ${kind}:`, missing);
    process.exit(1);
  }
}

for (const ua of ["Googlebot", "*"]) {
  const rule = ruleForUserAgent(ua);
  if (!rule) {
    console.error(`robots(): missing User-agent: ${ua}`);
    process.exit(1);
  }
  assertPaths(`User-agent: ${ua}`, rule, "disallow", catalogRobotsDisallow);
  assertPaths(`User-agent: ${ua}`, rule, "allow", catalogRobotsAllow);
}

if (privatePageRobots.index !== false || privatePageRobots.follow !== false) {
  console.error("privatePageRobots should be noindex,nofollow");
  process.exit(1);
}

console.log(`ok (robots Googlebot + * allow/disallow verified, privatePageRobots verified)`);
