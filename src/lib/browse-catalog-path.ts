/** Build `/browse` path + query for catalog filters and pagination (shared by UI and metadata). */
export function browseCatalogPath(input: {
  rail?: string | null;
  tag?: string | null;
  q?: string | null;
  vanilla?: boolean;
  sort?: string | null;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (input.vanilla) params.set("vanilla", "1");
  else if (input.tag) params.set("tag", input.tag);
  else if (input.rail === "new" || input.rail === "hot") params.set("rail", "new");
  else if (input.rail === "trending") params.set("rail", "trending");
  if (input.q) params.set("q", input.q);
  if (input.sort === "new") params.set("sort", "new");
  const page = Math.max(1, input.page ?? 1);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/browse?${qs}` : "/browse";
}
