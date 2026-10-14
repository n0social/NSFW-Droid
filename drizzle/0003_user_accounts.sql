CREATE TABLE IF NOT EXISTS "user_profile" (
	"firebase_uid" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"newsletter_opt_in" boolean DEFAULT false NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_favorite" (
	"firebase_uid" text NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_favorite" ADD CONSTRAINT "user_favorite_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_favorite_uid_listing_idx" ON "user_favorite" USING btree ("firebase_uid","listing_id");
