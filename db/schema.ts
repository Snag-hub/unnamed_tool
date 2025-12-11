import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

export const users = pgTable('user', {
  id: text('id')
    .notNull()
    .primaryKey(),
  name: text('name'),
  email: text('email')
    .notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  pro: boolean('pro')
    .notNull()
    .default(false),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type')
      .$type<AdapterAccountType>()
      .notNull(),
    provider: text('provider')
      .notNull(),
    providerAccountId: text('providerAccountId')
      .notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  account => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken')
    .notNull()
    .primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' })
    .notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier')
      .notNull(),
    token: text('token')
      .notNull(),
    expires: timestamp('expires', { mode: 'date' })
      .notNull(),
  },
  vt => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
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
  read: boolean('read')
    .notNull()
    .default(false),
  createdAt: timestamp('createdAt')
    .notNull()
    .defaultNow(),
});
