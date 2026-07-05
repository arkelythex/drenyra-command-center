/**
 * Context Monitor Types
 *
 * Types for tracking LLM context window usage per runId
 * and emitting threshold-based prune signals.
 *
 * @module @drenyra/ai/context-monitor
 */

import type { ChatMessage } from "../gateway/types";

/**
 * Current context usage snapshot for a run.
 */
export interface ContextUsage {
	/** Total tokens consumed across all requests in this run */
	totalTokens: number;
	/** Cumulative prompt tokens */
	promptTokens: number;
	/** Cumulative completion tokens */
	completionTokens: number;
	/** Model's maximum context window size */
	modelContextWindow: number;
	/** Model ID for this run */
	modelId: string;
	/** Ratio of totalTokens / modelContextWindow (0.0–1.0) */
	usageRatio: number;
	/** When this snapshot was taken */
	lastChecked: Date;
}

/**
 * Event emitted when a context threshold is crossed.
 */
export interface ContextThresholdEvent {
	/** The run that crossed the threshold */
	runId: string;
	/** Current usage snapshot */
	usage: ContextUsage;
	/** The threshold that was crossed (0.0–1.0) */
	threshold: number;
	/** Model ID for this run */
	modelId: string;
	/** When the threshold was crossed */
	timestamp: Date;
}

/**
 * Configuration for ContextMonitor.
 */
export interface ContextMonitorConfig {
	/** Enable context monitoring (default: false) */
	enabled: boolean;
	/** Usage ratio threshold that triggers prune signal (0.0–1.0, default: 0.95) */
	threshold: number;
}

/**
 * Internal per-run tracking state.
 */
export interface RunUsage {
	runId: string;
	modelId: string;
	contextWindow: number;
	totalTokens: number;
	/** Whether a threshold-crossing event has already been logged */
	eventsLogged: boolean;
}

// ─── Context Pruner Types ────────────────────────────────────────────────

/**
 * Pruning strategy selection.
 */
export type PrunerStrategy = "sliding-window" | "summarization" | "disabled";

/**
 * Configuration for ContextPruner.
 */
export interface ContextPrunerConfig {
	/** Pruning strategy (default: "sliding-window") */
	strategy: PrunerStrategy;
	/** Max non-system messages to keep when pruning (default: 6) */
	maxMessages: number;
	/** Token budget ratio vs context window (default: 0.95) */
	tokenBudgetRatio: number;
	/** Enable LLM summarization strategy (default: false) */
	enableSummarization: boolean;
	/** Override model for summarization (default: cheapest flash) */
	summarizationModel?: string;
}

/**
 * Result of a prune operation.
 */
export interface PruneResult {
	/** Pruned message array */
	messages: ChatMessage[];
	/** Which strategy was used */
	strategy: PrunerStrategy;
	/** Estimated tokens before pruning */
	tokensBefore: number;
	/** Estimated tokens after pruning */
	tokensAfter: number;
}

/**
 * Token budget information for a model.
 */
export interface TokenBudget {
	/** Max tokens before pruning triggers */
	maxTokens: number;
	/** Model's context window size */
	contextWindow: number;
	/** Applied ratio */
	ratio: number;
}
