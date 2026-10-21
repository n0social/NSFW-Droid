import { eq } from "drizzle-orm";
import type { CatalogDb } from "@/db";
import { listings } from "@/db/schema";
import { externalIdSlugSuffix, slugify, titleSlugBase } from "@/lib/slug";

export type ListingSlugAllocation = {
  slug: string;
  initialSlug: string;
  disambiguated: boolean;
  steps: string[];
};

export async function allocateUniqueListingSlug(
  db: CatalogDb,
  title: string,
  externalId: string,
  source: string,
): Promise<ListingSlugAllocation> {
  const initialSlug = slugify(title, externalId);
  const base = titleSlugBase(title);
  const idSuffix = externalIdSlugSuffix(externalId);
  const compactId = externalId.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(-16);

  const slugCandidates: string[] = [];
  const push = (s: string) => {
    const trimmed = s.replace(/^-+|-+$/g, "").slice(0, 120);
    if (trimmed && !slugCandidates.includes(trimmed)) slugCandidates.push(trimmed);
  };

  push(initialSlug);
  push(`${base}-${idSuffix}`);
  push(`${base}-id-${idSuffix}`);
  if (compactId.length >= 4) push(`${base}-${compactId}`);

  const steps: string[] = [];
  const tried = new Set<string>();

  for (let round = 0; round < 20; round++) {
    const slug =
      round < slugCandidates.length
        ? slugCandidates[round]!
        : `${base}-${idSuffix}-${round}`.slice(0, 120);
    if (tried.has(slug)) continue;
    tried.add(slug);

    const [row] = await db
      .select({ source: listings.source, externalId: listings.externalId })
      .from(listings)
      .where(eq(listings.slug, slug))
      .limit(1);

    if (!row) {
      return { slug, initialSlug, disambiguated: slug !== initialSlug, steps };
    }
    if (row.source === source && row.externalId === externalId) {
      return { slug, initialSlug, disambiguated: slug !== initialSlug, steps };
    }

    steps.push(`slug "${slug}" in use by ${row.source} (${row.externalId.slice(0, 80)})`);
  }

  throw new Error(
    `Could not allocate unique listing slug for "${title}" (${source}); tried ${tried.size} variants`,
  );
}
