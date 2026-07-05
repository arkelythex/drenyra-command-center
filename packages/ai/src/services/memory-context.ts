/**
 * Memory Context Provider
 *
 * Bridges the SessionStore persistence layer with agent prompts by querying
 * past completed agent runs and formatting them as readable context for
 * future agent invocations.
 *
 * This enables agents to learn from past successful runs without requiring
 * full conversational state — they get concise summaries of what was done
 * before for the same company.
 *
 * @module ai/memory
 */

import type { SessionStore } from "../session";
import type { AgentRunState } from "../session/session.types";

// ============================================================================
// Public Types
// ============================================================================

/**
 * Memory context returned by the provider for injection into agent prompts.
 */
export interface MemoryContext {
	/** Formatted summary of past runs, ready for prompt injection */
	summary: string;
	/** Number of recent runs included in the summary */
	recentRuns: number;
	/** Company identifier this context belongs to */
	companyId: string;
}

/**
 * Configuration for the MemoryContextProvider.
 */
export interface MemoryConfig {
	/** Maximum number of past runs to include (default: 5) */
	maxRuns: number;
	/** Maximum characters per individual run summary (default: 500) */
	maxSummaryLength: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: MemoryConfig = {
	maxRuns: 5,
	maxSummaryLength: 500,
};

// ============================================================================
// MemoryContextProvider
// ============================================================================

/**
 * Provides context from past successful agent runs for a given company.
 *
 * Queries the SessionStore for completed runs and formats them into a
 * structured summary that can be injected into agent prompts. This gives
 * agents awareness of prior work without maintaining conversational state.
 *
 * @example
 * ```ts
 * const provider = new MemoryContextProvider(sessionStore);
 * const ctx = await provider.getContext("ruc-20123456789");
 * // ctx.summary => "[Past Run 1]\nExtracted invoice: ...\n\n[Past Run 2]\n..."
 * ```
 */
export class MemoryContextProvider {
	private sessionStore: SessionStore;
	private config: MemoryConfig;

	constructor(sessionStore: SessionStore, config: Partial<MemoryConfig> = {}) {
		this.sessionStore = sessionStore;
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Get memory context for a company — past successful runs formatted as
	 * prompt context.
	 *
	 * Returns null when no completed runs exist for the company so callers
	 * can easily skip memory injection.
	 *
	 * @param companyId - The company identifier (e.g., "ruc-20123456789")
	 * @returns MemoryContext with formatted summaries, or null if no runs found
	 */
	async getContext(companyId: string): Promise<MemoryContext | null> {
		const runs = await this.sessionStore.listRunStates({
			companyId,
			status: "completed",
			limit: this.config.maxRuns,
		});

		if (runs.length === 0) return null;

		const summaries = runs
			.map((r, i) => this.formatRunSummary(r, i + 1))
			.filter(Boolean)
			.join("\n\n");

		return {
			summary: summaries,
			recentRuns: runs.length,
			companyId,
		};
	}

	/**
	 * Format a single run state into a readable summary block.
	 *
	 * Uses the stored `memorySummary` in the run's context if available,
	 * otherwise falls back to a minimal description derived from the run
	 * metadata (run ID, input type, workflow state, completion date).
	 *
	 * @param run - The agent run state from the session store
	 * @param index - 1-based index for display ordering
	 * @returns Formatted summary string
	 */
	private formatRunSummary(run: AgentRunState, index: number): string {
		const context = run.context ?? {};
		const memorySummary = context.memorySummary as string | undefined;
		const inputType = (context.inputType as string) ?? "unknown";
		const workflowState = run.workflowState ?? "unknown";
		const date = run.completedAt
			? new Date(run.completedAt).toISOString().split("T")[0]
			: "unknown";

		let summary =
			memorySummary ??
			`Run #${run.runId.slice(0, 8)} — ${inputType} — ${workflowState} — ${date}`;

		if (summary.length > this.config.maxSummaryLength) {
			summary = summary.slice(0, this.config.maxSummaryLength) + "...";
		}

		return `[Past Run ${index}]\n${summary}`;
	}
}
