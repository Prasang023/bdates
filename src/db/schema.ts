import { pgTable, uuid, varchar, integer, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const dateReports = pgTable('date_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  city: varchar('city', { length: 50 }).notNull(),
  neighborhood: varchar('neighborhood', { length: 100 }),
  platform: varchar('platform', { length: 50 }).notNull(),
  dateType: varchar('date_type', { length: 50 }).notNull(),
  expenseInr: integer('expense_inr').default(0).notNull(),
  timeWastedMins: integer('time_wasted_mins').default(0).notNull(),
  venueName: varchar('venue_name', { length: 150 }),
  venueNormalized: varchar('venue_normalized', { length: 150 }),
  disasterTags: text('disaster_tags').array().notNull(),
  storyBody: text('story_body').notNull(),
  upvotes: integer('upvotes').default(0).notNull(),
  ipHash: varchar('ip_hash', { length: 64 }).notNull(),
  isApproved: boolean('is_approved').default(true).notNull(),
  isScamFlagged: boolean('is_scam_flagged').default(false).notNull(),
});

export const siteVisitors = pgTable('site_visitors', {
  ipHash: text('ip_hash').primaryKey(),
  country: text('country').notNull().default('Unknown'),
  region: text('region'),
  city: text('city'),
  visitCount: integer('visit_count').default(1).notNull(),
  firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
});
