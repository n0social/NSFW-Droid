import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  integer,
  boolean,
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
  "manual",
]);

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "outbound_click",
  "listing_view",
  "page_view",
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

export const ingestRuns = pgTable("ingest_run", {
  id: uuid("id").defaultRandom().primaryKey(),
  job: text("job").notNull(),
  status: text("status").notNull().default("ok"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  summary: jsonb("summary"),
  errorMessage: text("error_message"),
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

/** Public catalog rows — no price columns; store pricing lives on outbound URLs only. */
export const listings = pgTable("listing", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  platforms: text("platforms").array().notNull().default(["browser"]),
  officialUrl: text("official_url").notNull(),
  affiliateUrl: text("affiliate_url"),
  artworkSource: text("artwork_source").notNull().default("typographic"),
  coverImageUrl: text("cover_image_url"),
  sponsorship: jsonb("sponsorship"),
  linkStatus: linkStatusEnum("link_status").notNull().default("ok"),
  catalogStale: boolean("catalog_stale").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  chartRank: integer("chart_rank"),
  chartBucket: text("chart_bucket"),
  source: sourceEnum("source"),
  externalId: text("external_id"),
});

export const developerSubmissions = pgTable("developer_submission", {
  id: uuid("id").defaultRandom().primaryKey(),
  candidateId: uuid("candidate_id"),
  contactEmail: text("contact_email").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: text("action").notNull(),
  actor: text("actor").notNull().default("admin"),
  targetId: uuid("target_id"),
  metadata: jsonb("metadata"),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const analyticsEvents = pgTable("analytics_event", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: analyticsEventTypeEnum("event_type").notNull(),
  listingId: uuid("listing_id"),
  path: text("path"),
  referrer: text("referrer"),
  sessionHash: text("session_hash"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userProfiles = pgTable("user_profile", {
  firebaseUid: text("firebase_uid").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  newsletterOptIn: boolean("newsletter_opt_in").notNull().default(false),
  preferences: jsonb("preferences").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userFavorites = pgTable(
  "user_favorite",
  {
    firebaseUid: text("firebase_uid").notNull(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_favorite_uid_listing_idx").on(t.firebaseUid, t.listingId)],
);

export const tags = pgTable("tag", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  kind: text("kind").notNull().default("general"),
});

export const listingTags = pgTable(
  "listing_tag",
  {
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("listing_tag_listing_tag_idx").on(t.listingId, t.tagId)],
);

export const candidateTags = pgTable(
  "candidate_tag",
  {
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("candidate_tag_candidate_tag_idx").on(t.candidateId, t.tagId)],
);

export type Tag = typeof tags.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type UserPreferences = {
  theme_preference?: "default" | "auto";
  blur_covers?: boolean;
  /** Signed-in only: last browse filters (see docs/engagement-policy.md). */
  browse?: {
    rail?: "hot" | "trending" | null;
    tag?: string | null;
    q?: string | null;
    vanilla?: boolean;
  };
};

export type Listing = typeof listings.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
