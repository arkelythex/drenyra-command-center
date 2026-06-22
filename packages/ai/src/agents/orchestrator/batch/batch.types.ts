/**
 * Batch Processing Types
 * Types for multi-run session orchestration (batch processing)
 *
 * @module ai/agents/orchestrator/batch/types
 */

import type { ProcessedInvoice, ReaderInput } from "../../types/workflow.types";

// ============================================================================
// Status Types
// ============================================================================

export type BatchStatus = "pending" | "running" | "completed" | "failed" | "partial" | "cancelled";
export type BatchItemStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

// ============================================================================
// Configuration
// ============================================================================

export interface BatchOrchestratorConfig {
	/** Max concurrent processInvoice() calls (default: 3) */
	maxConcurrent: number;
	/** Whether to persist batch state to the database (default: true) */
	enablePersistence: boolean;
	/** Company ID for tenant isolation */
	companyId: string;
}

// ============================================================================
// Batch Data Interfaces
// ============================================================================

export interface BatchItemResult {
	index: number;
	runId?: string;
	sessionId?: string;
	status: BatchItemStatus;
	result?: ProcessedInvoice;
	error?: string;
}

export interface BatchResult {
	batchId: string;
	status: BatchStatus;
	total: number;
	completed: number;
	failed: number;
	items: BatchItemResult[];
	error?: string;
}

// ============================================================================
// Event Types
// ============================================================================

export interface BatchProgressEvent {
	type: "BATCH_PROGRESS";
	batchId: string;
	total: number;
	completed: number;
	failed: number;
	timestamp: string;
}

export interface BatchCompletedEvent {
	type: "BATCH_COMPLETED";
	batchId: string;
	status: BatchStatus;
	total: number;
	completed: number;
	failed: number;
	timestamp: string;
}
