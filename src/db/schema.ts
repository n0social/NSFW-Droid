import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  integer,
} from "drizzle-orm/pg-core";

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
]);

export const sourceEnum = pgEnum("source", [
  "itch",
  "steam",
  "affiliate_export",
  "developer_form",
]);

export const linkStatusEnum = pgEnum("link_status", ["ok", "broken"]);

export const ingestSources = pgTable("ingest_source", {
  name: text("name").primaryKey(),
  enabled: text("enabled").notNull().default("true"),
  cursor: jsonb("cursor"),
  schedule: text("schedule"),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastError: text("last_error"),
});

export const candidates = pgTable(
  "candidate",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: sourceEnum("source").notNull(),
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    outboundUrl: text("outbound_url").notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    rawPayload: jsonb("raw_payload"),
    reviewStatus: reviewStatusEnum("review_status").notNull().default("pending"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by"),
    rejectReason: text("reject_reason"),
  },
  (t) => [uniqueIndex("candidate_source_external_idx").on(t.source, t.externalId)],
);

export const listings = pgTable("listing", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  platforms: text("platforms").array().notNull().default(["browser"]),
  officialUrl: text("official_url").notNull(),
  affiliateUrl: text("affiliate_url"),
  artworkSource: text("artwork_source").notNull().default("typographic"),
  sponsorship: jsonb("sponsorship"),
  linkStatus: linkStatusEnum("link_status").notNull().default("ok"),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  chartRank: integer("chart_rank"),
  chartBucket: text("chart_bucket"),
  source: sourceEnum("source"),
  externalId: text("external_id"),
});

export type Listing = typeof listings.$inferSelect;
