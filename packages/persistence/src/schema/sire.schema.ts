/**
 * SIRE Schema
 * Audit trail for SIRE submissions to SUNAT
 *
 * **SUNAT 2026 Compliance:**
 * - Idempotency tracking (prevent duplicate submissions)
 * - Full audit trail (timestamps, status, errors)
 * - Retry mechanism support
 * - Rate limiting metadata
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * SIRE Submissions
 *
 * Tracks all submission attempts to SUNAT SIRE API (or simulation mode).
 * Each submission is uniquely identified by idempotency key to prevent duplicates.
 *
 * **Business Rules:**
 * - One submission per (companyId + period + ledgerType) combination per month
 * - Idempotency key must be globally unique
 * - Status transitions: PENDING → SUBMITTED → ACCEPTED/REJECTED/OBSERVED
 * - Retry attempts tracked for operational visibility
 * @example
 * ```ts
 * console.log(sireSubmissions);
 * ```
 */

export const sireSubmissions = pgTable('sire_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),

  // Submission metadata
  period: varchar('period', { length: 7 }).notNull(), // YYYY-MM
  ledgerType: varchar('ledger_type', { length: 10 }).notNull(), // ventas, compras
  payloadFormat: varchar('payload_format', { length: 10 }).notNull(), // txt, csv, json, xml

  // Idempotency & retry
  idempotencyKey: varchar('idempotency_key', { length: 100 }).unique().notNull(),
  attemptNumber: integer('attempt_number').default(1).notNull(),
  maxRetries: integer('max_retries').default(3).notNull(),

  // Submission state
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  // PENDING, SUBMITTED, ACCEPTED, REJECTED, OBSERVED, SIMULATED, FAILED

  provider: varchar('provider', { length: 20 }).notNull(), // sunat-api, simulation
  dryRun: boolean('dry_run').default(false),

  // SUNAT response
  submissionId: varchar('submission_id', { length: 100 }), // SUNAT ticket ID
  sunatTicket: varchar('sunat_ticket', { length: 100 }),
  trackingId: varchar('tracking_id', { length: 100 }),

  // Response details
  sunatStatus: varchar('sunat_status', { length: 50 }),
  sunatCode: varchar('sunat_code', { length: 20 }),
  sunatMessage: text('sunat_message'),

  // Errors & warnings (JSONB for structured data)
  errors: jsonb('errors'), // Array<{ line: number, field: string, message: string }>
  warnings: jsonb('warnings'), // Array<{ line: number, field: string, message: string }>

  // Timing
  submittedAt: timestamp('submitted_at'),
  processedAt: timestamp('processed_at'),
  nextRetryAt: timestamp('next_retry_at'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by'),
});

/**
 * SIRE Rate Limits
 *
 * Tracks API usage per company to enforce rate limits.
 * Prevents abuse and ensures compliance with SUNAT API quotas.
 *
 * **Rate Limiting Rules:**
 * - Max 10 submissions per hour per company (configurable)
 * - Sliding window algorithm
 * - Reset at hour boundary
 * @example
 * ```ts
 * console.log(sireRateLimits);
 * ```
 */

export const sireRateLimits = pgTable('sire_rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),

  // Rate limit tracking
  windowStart: timestamp('window_start').notNull(),
  windowEnd: timestamp('window_end').notNull(),
  requestCount: integer('request_count').default(0).notNull(),
  maxRequests: integer('max_requests').default(10).notNull(),

  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * SIRE Jobs
 *
 * Queue for retry and scheduled SIRE operations.
 * Supports automatic retry of failed submissions with exponential backoff.
 *
 * **Job States:**
 * - QUEUED: Waiting to be processed
 * - RUNNING: Currently executing
 * - COMPLETED: Successfully finished
 * - FAILED: Failed after max retries
 * - CANCELLED: Manually cancelled
 * @example
 * ```ts
 * console.log(sireJobs);
 * ```
 */

export const sireJobs = pgTable('sire_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  submissionId: uuid('submission_id').notNull(), // FK to sireSubmissions

  // Job type
  jobType: varchar('job_type', { length: 50 }).notNull(), // SUBMIT, RETRY, SCHEDULED

  // Job state
  status: varchar('status', { length: 20 }).notNull().default('QUEUED'),
  // QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED

  // Retry logic
  attemptNumber: integer('attempt_number').default(1).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),

  // Scheduling
  scheduledAt: timestamp('scheduled_at').notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  // Error tracking
  lastError: text('last_error'),
  errorDetails: jsonb('error_details'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Relations
 * @example
 * ```ts
 * console.log(sireSubmissionsRelations);
 * ```
 */

export const sireSubmissionsRelations = relations(sireSubmissions, ({ many }) => ({
  jobs: many(sireJobs),
}));

/**
 * sireJobsRelations const.
 *
 * @example
 * ```ts
 * console.log(sireJobsRelations);
 * ```
 */
export const sireJobsRelations = relations(sireJobs, ({ one }) => ({
  submission: one(sireSubmissions, {
    fields: [sireJobs.submissionId],
    references: [sireSubmissions.id],
  }),
}));
