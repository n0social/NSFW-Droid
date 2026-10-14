CREATE TYPE "public"."link_status" AS ENUM('ok', 'broken');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('itch', 'steam', 'affiliate_export', 'developer_form');--> statement-breakpoint
CREATE TABLE "candidate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "source" NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"outbound_url" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_payload" jsonb,
	"review_status" "review_status" DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"reject_reason" text
);
--> statement-breakpoint
CREATE TABLE "ingest_source" (
	"name" text PRIMARY KEY NOT NULL,
	"enabled" text DEFAULT 'true' NOT NULL,
	"cursor" jsonb,
	"schedule" text,
	"last_run_at" timestamp with time zone,
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE "listing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"platforms" text[] DEFAULT '{"browser"}' NOT NULL,
	"official_url" text NOT NULL,
	"affiliate_url" text,
	"artwork_source" text DEFAULT 'typographic' NOT NULL,
	"sponsorship" jsonb,
	"link_status" "link_status" DEFAULT 'ok' NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"chart_rank" integer,
	"chart_bucket" text,
	"source" "source",
	"external_id" text,
	CONSTRAINT "listing_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_source_external_idx" ON "candidate" USING btree ("source","external_id");