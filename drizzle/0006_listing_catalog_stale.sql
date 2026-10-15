ALTER TABLE "listing" ADD COLUMN IF NOT EXISTS "catalog_stale" boolean DEFAULT false NOT NULL;
