import type { Metadata } from "next";

/** Pages that should not appear in search indexes (utility, auth, redirects). */
export const privatePageRobots: NonNullable<Metadata["robots"]> = {
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
