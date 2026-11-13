ALTER TABLE "listing" ADD COLUMN IF NOT EXISTS "sale_percent" integer;
--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN IF NOT EXISTS "sale_ends_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN IF NOT EXISTS "sale_checked_at" timestamp with time zone;
