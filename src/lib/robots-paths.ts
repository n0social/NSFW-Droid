/** Shared crawl policy for public catalog vs utility routes (robots.ts + tests). */
export const catalogRobotsAllow = [
  "/",
  "/browse",
  "/browse/",
  "/new",
  "/videos",
  "/creators",
  "/creators/",
  "/links",
  "/submit",
  "/terms",
  "/privacy",
  "/affiliate",
  "/dmca",
  "/game/",
] as const;

export const catalogRobotsDisallow = [
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
] as const;
