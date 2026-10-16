DO $$ BEGIN
 CREATE TYPE "public"."listing_report_reason" AS ENUM('wrong_content', 'broken_link', 'spam', 'copyright', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "listing_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"reason" "listing_report_reason" NOT NULL,
	"details" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "listing_report" ADD CONSTRAINT "listing_report_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listing_report_listing_id_idx" ON "listing_report" USING btree ("listing_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listing_report_created_at_idx" ON "listing_report" USING btree ("created_at");
