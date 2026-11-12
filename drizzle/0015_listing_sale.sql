ALTER TABLE "listing" ADD COLUMN IF NOT EXISTS "sale_percent" integer;
ALTER TABLE "listing" ADD COLUMN IF NOT EXISTS "sale_ends_at" timestamp with time zone;
ALTER TABLE "listing" ADD COLUMN IF NOT EXISTS "sale_checked_at" timestamp with time zone;
