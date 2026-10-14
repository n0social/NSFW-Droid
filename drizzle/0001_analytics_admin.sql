ALTER TYPE "source" ADD VALUE 'manual';--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."analytics_event_type" AS ENUM('outbound_click', 'listing_view', 'page_view');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "developer_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid,
	"contact_email" text NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "analytics_event_type" NOT NULL,
	"listing_id" uuid,
	"path" text,
	"referrer" text,
	"session_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
