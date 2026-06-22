/**
 * Error Recovery & Retry Engine Schema
 *
 * Persistent storage for:
 * - Circuit breaker states (per-agent/per-provider)
 * - Failed agent items (Dead Letter Queue for scheduled retry)
 *
 * Replaces the in-memory CircuitBreaker in
 * packages/ai/src/agents/orchestrator/workflow-v2/steps.ts
 *
 * @module persistence/schema/error-recovery
 */

import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

// ─── CIRCUIT BREAKER STATES ───────────────────────────────────────────────────

/**
 * circuitBreakerStates table.
 * Persists per-agent/per-provider circuit breaker state for distributed recovery.
 *
 * Unique on (agentName, scope) so each logical circuit has one row.
 */
export const circuitBreakerStates = pgTable(
	"circuit_breaker_states",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		agentName: text("agent_name").notNull(),
		state: text("state", {
			enum: ["CLOSED", "OPEN", "HALF_OPEN"],
		}).notNull(),
		failureCount: integer("failure_count").notNull().default(0),
		successCount: integer("success_count").notNull().default(0),
		lastFailureAt: timestamp("last_failure_at", { withTimezone: true }),
		lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
		openedAt: timestamp("opened_at", { withTimezone: true }),
		threshold: integer("threshold").notNull().default(5),
		timeoutMs: integer("timeout_ms").notNull().default(60000),
		scope: text("scope", { enum: ["agent", "provider"] }).notNull(),
		companyId: uuid("company_id"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		agentScopeIdx: uniqueIndex("idx_circuit_agent_scope").on(
			table.agentName,
			table.scope,
		),
	}),
);

// ─── FAILED AGENT ITEMS (DLQ) ────────────────────────────────────────────────

/**
 * failedAgentItems table.
 * Dead Letter Queue for agent items that failed processing.
 * Supports scheduled retry via nextRetryAt + status.
 */
export const failedAgentItems = pgTable(
	"failed_agent_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		runId: text("run_id").notNull(),
		agentName: text("agent_name").notNull(),
		errorType: text("error_type", {
			enum: ["TRANSIENT", "PERMANENT", "UNKNOWN"],
		}).notNull(),
		errorMessage: text("error_message").notNull(),
		errorDetails: jsonb("error_details"),
		workflowState: text("workflow_state"),
		retryCount: integer("retry_count").notNull().default(0),
		maxRetries: integer("max_retries").notNull().default(3),
		lastRetryAt: timestamp("last_retry_at", { withTimezone: true }),
		nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
		status: text("status", {
			enum: ["pending", "retrying", "resolved", "dead"],
		}).notNull(),
		companyId: uuid("company_id"),
		batchId: text("batch_id"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		statusNextRetryIdx: index("idx_dlq_status_next_retry").on(
			table.status,
			table.nextRetryAt,
		),
		agentNameIdx: index("idx_dlq_agent_name").on(table.agentName),
		runIdIdx: index("idx_dlq_run_id").on(table.runId),
		companyIdIdx: index("idx_dlq_company_id").on(table.companyId),
		createdAtIdx: index("idx_dlq_created_at").on(table.createdAt),
	}),
);

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type CircuitBreakerState = typeof circuitBreakerStates.$inferSelect;
export type NewCircuitBreakerState = typeof circuitBreakerStates.$inferInsert;

export type FailedAgentItem = typeof failedAgentItems.$inferSelect;
export type NewFailedAgentItem = typeof failedAgentItems.$inferInsert;
