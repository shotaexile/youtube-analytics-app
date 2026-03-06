import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  bigint,
  boolean,
  date,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

/**
 * Channel configuration (shared across all users)
 */
export const channelConfig = mysqlTable("channel_config", {
  id: int("id").autoincrement().primaryKey(),
  channelName: varchar("channelName", { length: 255 }).notNull().default("ViewCore"),
  channelUrl: varchar("channelUrl", { length: 512 }).default(""),
  channelId: varchar("channelId", { length: 128 }).default(""),
  iconUrl: text("iconUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ChannelConfigRow = typeof channelConfig.$inferSelect;
export type InsertChannelConfig = typeof channelConfig.$inferInsert;

/**
 * Individual video analytics data
 */
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  videoId: varchar("videoId", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 512 }).notNull(),
  publishedAt: varchar("publishedAt", { length: 32 }).notNull(),
  publishedDate: date("publishedDate").notNull(),
  duration: int("duration").notNull().default(0),
  views: bigint("views", { mode: "number" }).notNull().default(0),
  estimatedRevenue: float("estimatedRevenue").notNull().default(0),
  impressions: bigint("impressions", { mode: "number" }).notNull().default(0),
  ctr: float("ctr").notNull().default(0),
  avgViewRate: float("avgViewRate").notNull().default(0),
  likeRate: float("likeRate").notNull().default(0),
  subscriberChange: int("subscriberChange").notNull().default(0),
  isShort: boolean("isShort").notNull().default(false),
  isPrivate: boolean("isPrivate").notNull().default(false),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VideoRow = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Monthly aggregated statistics
 */
export const monthlyStats = mysqlTable("monthly_stats", {
  id: int("id").autoincrement().primaryKey(),
  month: varchar("month", { length: 7 }).notNull().unique(),
  views: bigint("views", { mode: "number" }).notNull().default(0),
  revenue: float("revenue").notNull().default(0),
  videoCount: int("videoCount").notNull().default(0),
  subscriberChange: int("subscriberChange").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MonthlyStatsRow = typeof monthlyStats.$inferSelect;
export type InsertMonthlyStats = typeof monthlyStats.$inferInsert;

/**
 * CSV upload history
 */
export const csvUploads = mysqlTable("csv_uploads", {
  id: int("id").autoincrement().primaryKey(),
  uploadedBy: varchar("uploadedBy", { length: 64 }),
  videoCount: int("videoCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CsvUpload = typeof csvUploads.$inferSelect;

/**
 * Admin settings (password for CSV upload, push token registry, etc.)
 */
export const adminSettings = mysqlTable("admin_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 128 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;

/**
 * Push notification tokens from devices
 */
export const pushTokens = mysqlTable("push_tokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 512 }).notNull().unique(),
  deviceName: varchar("deviceName", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;
