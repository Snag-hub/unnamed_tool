import {
  timestamp,
  pgTable,
  text,
  boolean,
  pgEnum,
  integer,
  primaryKey,
  index,
  jsonb,
  uuid,
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
  emailNotifications: boolean('emailNotifications').default(true).notNull(),
  pushNotifications: boolean('pushNotifications').default(true).notNull(),
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

  // Analytics
  viewCount: integer('viewCount').default(0).notNull(),
  lastViewedAt: timestamp('lastViewedAt'),

  // Reader Mode
  content: text('content'), // Extracted HTML
  textContent: text('textContent'), // Plain text for search

  read: boolean('read')
    .notNull()
    .default(false),
  createdAt: timestamp('createdAt')
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow(),
}, (t) => [
  index('items_user_status_created_idx').on(t.userId, t.status, t.createdAt),
  index('items_user_url_idx').on(t.userId, t.url),
  index('items_user_view_count_idx').on(t.userId, t.viewCount),
]);

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
}, (t) => [
  index('reminders_user_scheduled_idx').on(t.userId, t.scheduledAt),
]);

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
}, (t) => [
  index('tasks_user_status_due_date_idx').on(t.userId, t.status, t.dueDate),
]);

export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#3B82F6'), // Default blue
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (t) => [
  index('tags_user_name_idx').on(t.userId, t.name),
]);

export const itemsToTags = pgTable('items_to_tags', {
  itemId: text('itemId').notNull().references(() => items.id, { onDelete: 'cascade' }),
  tagId: text('tagId').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.itemId, t.tagId] }),
}));

export const tasksToTags = pgTable('tasks_to_tags', {
  taskId: text('taskId').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  tagId: text('tagId').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.taskId, t.tagId] }),
}));

export const notesToTags = pgTable('notes_to_tags', {
  noteId: text('noteId').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  tagId: text('tagId').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.noteId, t.tagId] }),
}));

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
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
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

// Notes table
export const notes = pgTable('notes', {
  id: text('id')
    .notNull()
    .primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  content: text('content').notNull(),

  // Optional attachments (one of these, or none for standalone notes)
  taskId: text('taskId').references(() => tasks.id, { onDelete: 'cascade' }),
  meetingId: text('meetingId').references(() => meetings.id, { onDelete: 'cascade' }),
  itemId: text('itemId').references(() => items.id, { onDelete: 'cascade' }),

  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const rateLimits = pgTable('rate_limits', {
  key: text('key').notNull().primaryKey(),
  count: integer('count').notNull().default(0),
  reset: timestamp('reset').notNull(),
});

// System Logs for internal error tracking
export const systemLogs = pgTable('system_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  level: text('level').notNull(), // 'error', 'warn', 'info'
  message: text('message').notNull(),
  stack: text('stack'),
  context: jsonb('context'), // Stores metadata like userId, path, etc.
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});
