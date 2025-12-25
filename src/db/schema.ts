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
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'done', 'archived']);
export const taskTypeEnum = pgEnum('task_type', ['personal', 'work']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);
export const meetingTypeEnum = pgEnum('meeting_type', ['general', 'interview']);
export const interviewStageEnum = pgEnum('interview_stage', ['screening', 'technical', 'culture', 'offer', 'rejected']);

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
  taskId: text('taskId')
    .references(() => tasks.id, { onDelete: 'cascade' }),
  meetingId: text('meetingId')
    .references(() => meetings.id, { onDelete: 'cascade' }),
  title: text('title'),
  scheduledAt: timestamp('scheduledAt').notNull(),
  recurrence: recurrenceEnum('recurrence').default('none').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const projects = pgTable('projects', {
  id: text('id').notNull().primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#000000'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: text('id').notNull().primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('projectId').references(() => projects.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('dueDate'),
  type: taskTypeEnum('type').default('personal').notNull(),
  status: taskStatusEnum('status').default('pending').notNull(),
  priority: taskPriorityEnum('priority').default('medium').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const meetings = pgTable('meetings', {
  id: text('id').notNull().primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  link: text('link'),
  startTime: timestamp('startTime').notNull(),
  endTime: timestamp('endTime').notNull(),
  type: meetingTypeEnum('type').default('general').notNull(),
  stage: interviewStageEnum('stage'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id')
    .notNull()
    .primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});
