import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
export const sireSubmissions = pgTable('sire_submissions', {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull(),
    period: varchar('period', { length: 7 }).notNull(),
    ledgerType: varchar('ledger_type', { length: 10 }).notNull(),
    payloadFormat: varchar('payload_format', { length: 10 }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 100 }).unique().notNull(),
    attemptNumber: integer('attempt_number').default(1).notNull(),
    maxRetries: integer('max_retries').default(3).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('PENDING'),
    provider: varchar('provider', { length: 20 }).notNull(),
    dryRun: boolean('dry_run').default(false),
    submissionId: varchar('submission_id', { length: 100 }),
    sunatTicket: varchar('sunat_ticket', { length: 100 }),
    trackingId: varchar('tracking_id', { length: 100 }),
    sunatStatus: varchar('sunat_status', { length: 50 }),
    sunatCode: varchar('sunat_code', { length: 20 }),
    sunatMessage: text('sunat_message'),
    errors: jsonb('errors'),
    warnings: jsonb('warnings'),
    submittedAt: timestamp('submitted_at'),
    processedAt: timestamp('processed_at'),
    nextRetryAt: timestamp('next_retry_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: uuid('created_by'),
});
export const sireRateLimits = pgTable('sire_rate_limits', {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull(),
    windowStart: timestamp('window_start').notNull(),
    windowEnd: timestamp('window_end').notNull(),
    requestCount: integer('request_count').default(0).notNull(),
    maxRequests: integer('max_requests').default(10).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
export const sireJobs = pgTable('sire_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull(),
    submissionId: uuid('submission_id').notNull(),
    jobType: varchar('job_type', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('QUEUED'),
    attemptNumber: integer('attempt_number').default(1).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    scheduledAt: timestamp('scheduled_at').notNull(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    lastError: text('last_error'),
    errorDetails: jsonb('error_details'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
export const sireSubmissionsRelations = relations(sireSubmissions, ({ many }) => ({
    jobs: many(sireJobs),
}));
export const sireJobsRelations = relations(sireJobs, ({ one }) => ({
    submission: one(sireSubmissions, {
        fields: [sireJobs.submissionId],
        references: [sireSubmissions.id],
    }),
}));
//# sourceMappingURL=sire.schema.js.map