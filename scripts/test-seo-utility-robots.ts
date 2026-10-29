import robots from "../src/app/robots";
import { privatePageRobots } from "../src/lib/seo-private";

const REQUIRED_DISALLOW = [
  "/admin",
  "/admin/",
  "/api/",
  "/account/",
  "/sign-in",
  "/sign-up",
  "/settings",
  "/settings/",
  "/newsletter",
  "/newsletter/",
  "/underage",
  "/underage/",
];

const REQUIRED_ALLOW = [
  "/",
  "/browse",
  "/new",
  "/videos",
  "/creators",
  "/links",
  "/game/",
];

const rules = robots().rules;
if (!rules || Array.isArray(rules)) {
  console.error("robots(): expected a single rules object");
  process.exit(1);
}

const disallow = rules.disallow ?? [];
const missingDisallow = REQUIRED_DISALLOW.filter((path) => !disallow.includes(path));
if (missingDisallow.length > 0) {
  console.error("robots() missing disallow:", missingDisallow);
  process.exit(1);
}

const allow = rules.allow ?? [];
const missingAllow = REQUIRED_ALLOW.filter((path) => !allow.includes(path));
if (missingAllow.length > 0) {
  console.error("robots() missing allow:", missingAllow);
  process.exit(1);
}

if (privatePageRobots.index !== false || privatePageRobots.follow !== false) {
  console.error("privatePageRobots should be noindex,nofollow");
  process.exit(1);
}

console.log(`ok (robots disallow ${disallow.length} paths, privatePageRobots verified)`);
