import type { Metadata } from "next";

type RobotsDirective = Exclude<NonNullable<Metadata["robots"]>, string>;

/** Pages that should not appear in search indexes (utility, auth, redirects). */
export const privatePageRobots: RobotsDirective = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

export function privatePageMetadata(title: string): Metadata {
  return { title, robots: privatePageRobots };
}
