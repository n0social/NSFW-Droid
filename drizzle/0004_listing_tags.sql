CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"kind" text DEFAULT 'general' NOT NULL,
	CONSTRAINT "tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "listing_tag" (
	"listing_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "listing_tag_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "listing_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX "listing_tag_listing_tag_idx" ON "listing_tag" USING btree ("listing_id","tag_id");
--> statement-breakpoint
CREATE TABLE "candidate_tag" (
	"candidate_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "candidate_tag_candidate_id_candidate_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "candidate_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_tag_candidate_tag_idx" ON "candidate_tag" USING btree ("candidate_id","tag_id");
