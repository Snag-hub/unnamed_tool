import {
  timestamp,
  pgTable,
  text,
  boolean,
  pgEnum,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { AdapterAccount } from 'next-auth/adapters';

// Enums
export const statusEnum = pgEnum('status', ['inbox', 'reading', 'archived', 'trash']);
export const itemTypeEnum = pgEnum('item_type', ['article', 'video', 'social', 'other']);

// Simplified users table for Clerk
export const users = pgTable('user', {
  id: text('id')
    .notNull()
    .primaryKey(), // Clerk user ID
  name: text('name'),
  email: text('email')
    .notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  apiToken: text('apiToken'),
  createdAt: timestamp('createdAt')
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [
    primaryKey({ columns: [vt.identifier, vt.token] }),
  ]
);

export const items = pgTable('items', {
  id: text('id')
    .notNull()
    .primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  url: text('url')
    .notNull(),
  title: text('title'),
  image: text('image'),
  description: text('description'),

  // V2 Fields
  status: statusEnum('status').default('inbox').notNull(),
  type: itemTypeEnum('type').default('other').notNull(),
  isFavorite: boolean('isFavorite').default(false).notNull(),
  reminderAt: timestamp('reminderAt'),

  // Enhanced Metadata
  siteName: text('siteName'),
  favicon: text('favicon'),
  author: text('author'),
  duration: integer('duration'), // in seconds

  read: boolean('read') // Keeping for backward compatibility, but 'status' replaces this logic
    .notNull()
    .default(false),
  createdAt: timestamp('createdAt')
    .notNull()
    .defaultNow(),
});

export const recurrenceEnum = pgEnum('recurrence', ['none', 'daily', 'weekly', 'monthly']);

export const reminders = pgTable('reminders', {
  id: text('id')
    .notNull()
    .primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  itemId: text('itemId')
    .references(() => items.id, { onDelete: 'cascade' }),
  title: text('title'),
  scheduledAt: timestamp('scheduledAt').notNull(),
  recurrence: recurrenceEnum('recurrence').default('none').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});
