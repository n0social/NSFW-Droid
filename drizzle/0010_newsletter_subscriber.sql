CREATE TABLE IF NOT EXISTS "newsletter_subscriber" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"token_hash" text,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"source" text DEFAULT 'footer',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscriber_email_idx" ON "newsletter_subscriber" USING btree ("email");
