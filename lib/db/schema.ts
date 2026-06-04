import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
  balance: numeric('balance', { precision: 10, scale: 6 }).notNull().default('0.000000'),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  emailVerified: timestamp('email_verified'),
  verificationToken: varchar('verification_token', { length: 255 }).unique(),
  verificationTokenExpiresAt: timestamp('verification_token_expires_at'),
  resetToken: varchar('reset_token', { length: 255 }).unique(),
  resetTokenExpiresAt: timestamp('reset_token_expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const userPreferences = pgTable('user_preferences', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').notNull().default({}),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tokenUsages = pgTable('token_usages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  requestId: varchar('request_id', { length: 255 }).notNull().unique(),
  model: varchar('model', { length: 255 }).notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  reasoningTokens: integer('reasoning_tokens').notNull().default(0),
  totalTokens: integer('total_tokens').notNull(),
  cost: numeric('cost', { precision: 12, scale: 8 }).notNull(),
  claudeCost: numeric('claude_cost', { precision: 12, scale: 8 }).notNull().default('0'),
  savings: numeric('savings', { precision: 12, scale: 8 }).notNull().default('0'),
  opusCost: numeric('opus_cost', { precision: 12, scale: 8 }).notNull().default('0'),
  opusSavings: numeric('opus_savings', { precision: 12, scale: 8 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const debugLogs = pgTable('debug_logs', {
  id: serial('id').primaryKey(),
  requestId: varchar('request_id', { length: 255 }),
  apiKey: varchar('api_key', { length: 255 }),
  model: varchar('model', { length: 255 }),
  prompt: text('prompt'),
  messages: jsonb('messages'),
  responseText: text('response_text'),
  thinkingText: text('thinking_text'),
  rawUsage: jsonb('raw_usage'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  tokenUsages: many(tokenUsages),
  activityLogs: many(activityLogs),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const tokenUsagesRelations = relations(tokenUsages, ({ one }) => ({
  user: one(users, {
    fields: [tokenUsages.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type TokenUsage = typeof tokenUsages.$inferSelect;
export type NewTokenUsage = typeof tokenUsages.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type DebugLog = typeof debugLogs.$inferSelect;
export type NewDebugLog = typeof debugLogs.$inferInsert;

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  ROTATE_API_KEY = 'ROTATE_API_KEY',
  ADD_FUNDS = 'ADD_FUNDS',
}
