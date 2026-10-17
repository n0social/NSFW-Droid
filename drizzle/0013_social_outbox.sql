CREATE TYPE "public"."social_platform" AS ENUM('mastodon', 'pillowfort');--> statement-breakpoint
CREATE TYPE "public"."social_outbox_status" AS ENUM('pending', 'posted', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"platform" "social_platform" NOT NULL,
	"status" "social_outbox_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"external_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"posted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "social_outbox" ADD CONSTRAINT "social_outbox_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "social_outbox_listing_platform_idx" ON "social_outbox" USING btree ("listing_id","platform");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "social_outbox_status_platform_idx" ON "social_outbox" USING btree ("status","platform");
