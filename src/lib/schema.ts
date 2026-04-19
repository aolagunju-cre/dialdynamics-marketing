import {
  pgTable,
  varchar,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const diagnosticSessions = pgTable(
  "diagnostic_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challenge: varchar("challenge", { length: 50 }).notNull(),
    persona: varchar("persona", { length: 20 }).notNull(),
    score: integer("score"),
    scoreLabel: varchar("score_label", { length: 10 }),
    transcript: text("transcript"),
    drillCompleted: boolean("drill_completed").default(false),
    referralCodeUsed: varchar("referral_code_used", { length: 20 }),
    referrerCode: varchar("referrer_code", { length: 20 }),
    referrerName: varchar("referrer_name", { length: 100 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("session_created_at_idx").on(table.createdAt),
    index("session_referral_code_idx").on(table.referralCodeUsed),
  ]
);

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  sessionId: uuid("session_id").references(() => diagnosticSessions.id),
  challenge: varchar("challenge", { length: 50 }),
  referralCount: integer("referral_count").default(0),
  hasUnlocked: boolean("has_unlocked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessionAccess = pgTable("session_access", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .references(() => diagnosticSessions.id)
    .notNull(),
  accessType: varchar("access_type", { length: 20 }).notNull(),
  stripePaymentId: varchar("stripe_payment_id", { length: 100 }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accessLogs = pgTable(
  "access_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").references(() => diagnosticSessions.id),
    event: varchar("event", { length: 50 }).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("log_session_idx").on(table.sessionId)]
);

export type DiagnosticSession = typeof diagnosticSessions.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type SessionAccess = typeof sessionAccess.$inferSelect;
