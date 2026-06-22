import { pgTable, text, timestamp, boolean, integer, varchar, jsonb, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// BetterAuth schema for authentication
/**
 * authUsers const.
 *
 * @example
 * ```ts
 * console.log(authUsers);
 * ```
 */
export const authUsers = pgTable('auth_users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  ruc: text('ruc').default(''),
  // Rate-limiting fields (used by distributed login guard)
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * authSessions const.
 *
 * @example
 * ```ts
 * console.log(authSessions);
 * ```
 */
export const authSessions = pgTable('auth_sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
});

/**
 * authAccounts const.
 *
 * @example
 * ```ts
 * console.log(authAccounts);
 * ```
 */
export const authAccounts = pgTable('auth_accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * authVerifications const.
 *
 * @example
 * ```ts
 * console.log(authVerifications);
 * ```
 */
export const authVerifications = pgTable('auth_verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * authAuditLogs const.
 *
 * @example
 * ```ts
 * console.log(authAuditLogs);
 * ```
 */
export const authAuditLogs = pgTable('auth_audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => authUsers.id),
  action: varchar('action', { length: 50 }).notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  details: jsonb('details'),
});

/**
 * authUserCompanies const.
 *
 * Membership bridge between Better Auth users and Arkelythex companies.
 * This is the foundation for real multi-company access without coupling
 * auth directly to a single RUC forever.
 * @example
 * ```ts
 * console.log(authUserCompanies);
 * ```
 */
export const authUserCompanies = pgTable(
  'auth_user_companies',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').notNull(),
    membershipRole: varchar('membership_role', { length: 50 }).notNull().default('ACCOUNTANT'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('auth_user_companies_user_id_idx').on(table.userId),
    companyIdIdx: index('auth_user_companies_company_id_idx').on(table.companyId),
    userCompanyUniqueIdx: uniqueIndex('auth_user_companies_user_company_uidx').on(
      table.userId,
      table.companyId,
    ),
  }),
);

// Relations

/**
 * authUsersRelations const.
 *
 * @example
 * ```ts
 * console.log(authUsersRelations);
 * ```
 */
export const authUsersRelations = relations(authUsers, ({ many }) => ({
  sessions: many(authSessions),
  accounts: many(authAccounts),
  companies: many(authUserCompanies),
}));

/**
 * authSessionsRelations const.
 *
 * @example
 * ```ts
 * console.log(authSessionsRelations);
 * ```
 */
export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(authUsers, { fields: [authSessions.userId], references: [authUsers.id] }),
}));

/**
 * authAccountsRelations const.
 *
 * @example
 * ```ts
 * console.log(authAccountsRelations);
 * ```
 */
export const authAccountsRelations = relations(authAccounts, ({ one }) => ({
  user: one(authUsers, { fields: [authAccounts.userId], references: [authUsers.id] }),
}));

/**
 * authAuditLogsRelations const.
 *
 * @example
 * ```ts
 * console.log(authAuditLogsRelations);
 * ```
 */
export const authAuditLogsRelations = relations(authAuditLogs, ({ one }) => ({
  user: one(authUsers, { fields: [authAuditLogs.userId], references: [authUsers.id] }),
}));

/**
 * authUserCompaniesRelations const.
 *
 * @example
 * ```ts
 * console.log(authUserCompaniesRelations);
 * ```
 */
export const authUserCompaniesRelations = relations(authUserCompanies, ({ one }) => ({
  user: one(authUsers, {
    fields: [authUserCompanies.userId],
    references: [authUsers.id],
  }),
}));
