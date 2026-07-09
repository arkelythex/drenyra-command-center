/**
 * Batch Processing Types
 * Types for multi-run session orchestration (batch processing)
 *
 * @module ai/agents/orchestrator/batch/types
 */

import type { RetryEngine } from "../../../services/error-recovery";

// ============================================================================
// Status Types
// ============================================================================

export type BatchStatus =
	| "pending"
	| "running"
	| "completed"
	| "failed"
	| "partial"
	| "cancelled";
export type BatchItemStatus =
	| "pending"
	| "running"
	| "completed"
	| "failed"
	| "cancelled";

// ============================================================================
// Configuration
// ============================================================================

export interface BatchOrchestratorConfig {
	/** Max concurrent processInvoice() calls (default: 3) */
	readonly maxConcurrent: number;
	/** Whether to persist batch state to the database (default: true) */
	readonly enablePersistence: boolean;
	/** Company ID for tenant isolation */
	readonly companyId: string;
	/** Optional RetryEngine for DLQ integration on item failure */
	readonly retryEngine?: RetryEngine;
}

// ============================================================================
// Batch Data Interfaces
// ============================================================================

/** Processed invoice data returned by the orchestrator */
export interface BatchProcessedInvoice {
	readonly status: string;
	readonly invoiceData?: Record<string, unknown>;
	readonly processingLog?: Record<string, unknown>;
}

export interface BatchItemResult {
	index: number;
	runId?: string;
	sessionId?: string;
	status: BatchItemStatus;
	result?: BatchProcessedInvoice;
	error?: string;
}

export interface BatchResult {
	batchId: string;
	status: BatchStatus;
	total: number;
	completed: number;
	failed: number;
	items: readonly BatchItemResult[];
	error?: string;
}

// ============================================================================
// Event Types
// ============================================================================

export interface BatchProgressEvent {
	readonly type: "BATCH_PROGRESS";
	readonly batchId: string;
	readonly total: number;
	readonly completed: number;
	readonly failed: number;
	readonly timestamp: string;
}

export interface BatchCompletedEvent {
	readonly type: "BATCH_COMPLETED";
	readonly batchId: string;
	readonly status: BatchStatus;
	readonly total: number;
	readonly completed: number;
	readonly failed: number;
	readonly timestamp: string;
}
