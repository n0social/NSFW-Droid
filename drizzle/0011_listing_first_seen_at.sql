ALTER TABLE "listing" ADD COLUMN IF NOT EXISTS "first_seen_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "listing" AS l
SET "first_seen_at" = c."first_seen_at"
FROM "candidate" AS c
WHERE l."source" IS NOT NULL
  AND l."external_id" IS NOT NULL
  AND c."source" = l."source"
  AND c."external_id" = l."external_id"
  AND l."first_seen_at" IS NULL;
--> statement-breakpoint
UPDATE "listing"
SET "first_seen_at" = "published_at"
WHERE "first_seen_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "listing" ALTER COLUMN "first_seen_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "listing" ALTER COLUMN "first_seen_at" SET NOT NULL;
