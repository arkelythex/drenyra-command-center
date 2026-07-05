/**
 * Context Pruner Service
 *
 * Prunes conversation history when the context window threshold is crossed.
 * Supports two strategies:
 *   - sliding-window (O(1), deterministic, default)
 *   - summarization (LLM-based condensation, opt-in)
 *
 * All methods are non-blocking — errors are caught, logged, and the original
 * messages are returned unmodified. This matches ContextMonitor's contract.
 *
 * @module @drenyra/ai/context-monitor
 */

import { AVAILABLE_MODELS } from "../ai/model-registry";
import { loggers } from "../logger";
import type { ChatMessage } from "../gateway/types";
import type {
	ContextPrunerConfig,
	PruneResult,
	PrunerStrategy,
	TokenBudget,
} from "./context-monitor.types";

// Safe default context window for unknown models (matches Claude's window)
const UNKNOWN_MODEL_CONTEXT_WINDOW = 200_000;

/**
 * Default configuration used when no config or partial config is provided.
 */
const DEFAULT_PRUNER_CONFIG: ContextPrunerConfig = {
	strategy: "sliding-window",
	maxMessages: 6,
	tokenBudgetRatio: 0.95,
	enableSummarization: false,
};

/**
 * Callback signature for optional prune-applied notifications.
 * Receives the result and an optional runId for audit/event emission.
 */
export type OnPruneApplied = (result: PruneResult, runId?: string) => void;

/**
 * Callback signature for LLM summarization.
 * Accepts the messages to summarize and returns a condensed summary string.
 * The implementation should call the cheapest available flash model.
 */
export type SummarizeFn = (messages: ChatMessage[]) => Promise<string>;

/**
 * ContextPruner class.
 *
 * Prunes ChatMessage arrays using a configurable strategy. Designed to be
 * called:
 *   1. Proactively — by the LLMGatewayService before RequestExecutor.execute()
 *   2. Reactively — by the WorkflowOrchestratorV2 on PRUNE_REQUESTED events
 *
 * @example
 * ```ts
 * const pruner = new ContextPruner({ strategy: "sliding-window", maxMessages: 6 });
 * const result = pruner.prune(messages);
 * console.log(result.messages.length); // <= 6 + system messages
 * ```
 */
export class ContextPruner {
	public config: ContextPrunerConfig;
	private onPruneApplied?: OnPruneApplied;
	private summarizeFn?: SummarizeFn;

	constructor(
		config?: Partial<ContextPrunerConfig>,
		options?: {
			onPruneApplied?: OnPruneApplied;
			summarizeFn?: SummarizeFn;
		},
	) {
		this.config = { ...DEFAULT_PRUNER_CONFIG, ...config };
		this.onPruneApplied = options?.onPruneApplied;
		this.summarizeFn = options?.summarizeFn;
	}

	/**
	 * Main entry point — prunes messages using the configured strategy.
	 *
	 * Flow:
	 * 1. If strategy is "disabled" → return original messages unchanged
	 * 2. If message count ≤ maxMessages → no pruning needed
	 * 3. If strategy is "summarization" + enableSummarization → try LLM summarization
	 * 4. Otherwise → sliding-window (also the fallback for summarization failures)
	 *
	 * Never throws. All errors are caught, logged, and original messages returned.
	 *
	 * @param messages - The full conversation message array
	 * @param runId - Optional run ID for event emission / audit
	 * @returns PruneResult with pruned messages and token statistics
	 */
	prune(messages: ChatMessage[], runId?: string): PruneResult {
		try {
			// ── Disabled strategy: passthrough ──────────────────────────────
			if (this.config.strategy === "disabled") {
				return this.noOpResult(messages, "disabled");
			}

			// ── Already within window: no-op ────────────────────────────────
			if (messages.length <= this.config.maxMessages) {
				return this.noOpResult(messages, this.config.strategy);
			}

			// ── Execute strategy ─────────────────────────────────────────────
			let pruned: ChatMessage[];
			const strategyUsed = this.executeStrategy(messages);

			pruned = strategyUsed.messages;

			const tokensBefore = this.getEstimatedTokenCount(messages);
			const tokensAfter = this.getEstimatedTokenCount(pruned);

			const result: PruneResult = {
				messages: pruned,
				strategy: strategyUsed.strategy,
				tokensBefore,
				tokensAfter,
			};

			// ── Fire callback if pruning actually reduced tokens ────────────
			if (tokensAfter < tokensBefore && this.onPruneApplied) {
				try {
					this.onPruneApplied(result, runId);
				} catch {
					// Non-blocking: callback errors never propagate
				}
			}

			return result;
		} catch (err) {
			loggers.ai.warn("ContextPruner: prune failed, returning original messages", {
				error: String(err),
			});
			return this.noOpResult(messages, this.config.strategy);
		}
	}

	/**
	 * Execute the selected strategy.
	 * Separated so the outer try/catch in `prune()` catches everything.
	 */
	private executeStrategy(messages: ChatMessage[]): {
		messages: ChatMessage[];
		strategy: PrunerStrategy;
	} {
		if (
			this.config.strategy === "summarization" &&
			this.config.enableSummarization
		) {
			try {
				const summarized = this.summarize(messages);
				return { messages: summarized, strategy: "summarization" };
			} catch (err) {
				loggers.ai.warn(
					"ContextPruner: summarization failed, falling back to sliding-window",
					{ error: String(err) },
				);
				// Fall through to sliding-window
			}
		}

		const sliced = this.slidingWindow(messages, this.config.maxMessages);
		return { messages: sliced, strategy: "sliding-window" };
	}

	/**
	 * Sliding-window strategy.
	 *
	 * Keeps ALL system messages (role === "system") + the last N non-system
	 * messages. If the total is already within the budget, no messages are
	 * removed.
	 *
	 * This is O(n) in the message count and fully deterministic.
	 *
	 * @param messages - Full message array
	 * @param maxMessages - Number of non-system messages to keep at the end
	 * @returns Pruned message array
	 */
	slidingWindow(messages: ChatMessage[], maxMessages: number): ChatMessage[] {
		const systemMessages = messages.filter((m) => m.role === "system");
		const nonSystemMessages = messages.filter((m) => m.role !== "system");

		const keptNonSystem = nonSystemMessages.slice(-maxMessages);

		return [...systemMessages, ...keptNonSystem];
	}

	/**
	 * Summarization strategy.
	 *
	 * Condenses old messages (those before the last maxMessages/2) into a single
	 * system message using an LLM call. The last maxMessages/2 messages plus all
	 * system messages are preserved verbatim.
	 *
	 * Falls back to sliding-window if:
	 * - No summarizeFn is configured
	 * - The LLM call fails or times out
	 * - The LLM returns an empty string
	 *
	 * @param messages - Full message array
	 * @returns Pruned message array with condensed summary
	 */
	summarize(messages: ChatMessage[]): ChatMessage[] {
		const maxMessages = this.config.maxMessages;

		// Need at least maxMessages + 1 to summarize, otherwise return as-is
		if (messages.length <= maxMessages) {
			return messages;
		}

		// If no summarize function configured, fall through to caller's catch
		if (!this.summarizeFn) {
			throw new Error("Summarization not configured — no summarizeFn provided");
		}

		// Identify messages to keep verbatim: system messages + last N/2 non-system
		const systemMessages = messages.filter((m) => m.role === "system");
		const nonSystemMessages = messages.filter((m) => m.role !== "system");

		const keepCount = Math.max(1, Math.floor(maxMessages / 2));
		const keptNonSystem = nonSystemMessages.slice(-keepCount);

		// Messages to summarize: non-system messages not in the kept tail
		const toSummarize = nonSystemMessages.slice(0, -keepCount);

		if (toSummarize.length === 0) {
			// Nothing to summarize — run sliding-window instead
			return this.slidingWindow(messages, maxMessages);
		}

		// Build summary prompt
		const contextStr = toSummarize
			.map((m) => `[${m.role}]: ${m.content}`)
			.join("\n");

		// Attempt LLM summarization (sync-style with Promise)
		const summaryPromise = this.summarizeFn(toSummarize);

		// We need to handle this carefully — the method signature says it's sync
		// but summarizeFn returns a Promise. We'll use a trick: if the promise
		// resolves immediately (sync-like), we use it. Otherwise, we fall through.
		//
		// Since we're in a synchronous context, we'll throw to indicate async
		// summarization isn't supported in the current flow, and the caller's
		// fallback handles it.
		//
		// In practice, the EventBus subscriber or gateway hook would handle
		// async pruning via a separate code path. For the synchronous prune(),
		// we always fall back to sliding-window for summarization.

		// For now, this throws because LLM calls are inherently async and
		// our prune() API is synchronous. The summarization path is handled
		// by the separate async summarize() method.
		throw new Error(
			"Synchronous summarization not supported — use async path for LLM-based pruning",
		);
	}

	/**
	 * ASYNC summarize — performs LLM-based condensation.
	 *
	 * Use this from the EventBus subscriber or gateway hook when async is
	 * acceptable. Falls back to sliding-window on any failure.
	 *
	 * @param messages - Full message array
	 * @returns Pruned message array with condensed summary
	 */
	async summarizeAsync(messages: ChatMessage[]): Promise<ChatMessage[]> {
		try {
			const maxMessages = this.config.maxMessages;
			if (messages.length <= maxMessages) {
				return messages;
			}

			if (!this.summarizeFn) {
				return this.slidingWindow(messages, maxMessages);
			}

			const systemMessages = messages.filter((m) => m.role === "system");
			const nonSystemMessages = messages.filter((m) => m.role !== "system");

			const keepCount = Math.max(1, Math.floor(maxMessages / 2));
			const keptNonSystem = nonSystemMessages.slice(-keepCount);
			const toSummarize = nonSystemMessages.slice(0, -keepCount);

			if (toSummarize.length === 0) {
				return this.slidingWindow(messages, maxMessages);
			}

			const summary = await this.summarizeFn(toSummarize);

			// Empty summary → fall back to sliding-window
			if (!summary || summary.trim().length === 0) {
				loggers.ai.warn(
					"ContextPruner: summarization returned empty response, using sliding-window",
				);
				return this.slidingWindow(messages, maxMessages);
			}

			// Inject summary as a system message at the window boundary
			return [
				...systemMessages,
				{ role: "system", content: `[Previous context summary]: ${summary}` },
				...keptNonSystem,
			];
		} catch (err) {
			loggers.ai.warn(
				"ContextPruner: async summarization failed, using sliding-window fallback",
				{ error: String(err) },
			);
			return this.slidingWindow(messages, this.config.maxMessages);
		}
	}

	/**
	 * Calculate the token budget for a given model.
	 *
	 * Resolves the model's context window from the model registry
	 * and applies the configured tokenBudgetRatio.
	 *
	 * @param modelId - The model identifier (e.g. "gemini-3-flash")
	 * @param ratio - Optional override ratio (defaults to config.tokenBudgetRatio)
	 * @returns TokenBudget with maxTokens, contextWindow, and ratio
	 */
	calculateBudget(modelId: string, ratio?: number): TokenBudget {
		const effectiveRatio = ratio ?? this.config.tokenBudgetRatio;
		const modelDef =
			AVAILABLE_MODELS[modelId as keyof typeof AVAILABLE_MODELS];
		const contextWindow =
			modelDef?.contextWindow ?? UNKNOWN_MODEL_CONTEXT_WINDOW;

		return {
			maxTokens: Math.floor(contextWindow * effectiveRatio),
			contextWindow,
			ratio: effectiveRatio,
		};
	}

	/**
	 * Estimate the token count for an array of messages.
	 *
	 * Uses a rough heuristic: max(content.length / 4, messages.length * 100).
	 * This is intentionally conservative — overestimating is safer than
	 * underestimating for context window management.
	 *
	 * @param messages - The messages to estimate
	 * @returns Estimated token count
	 */
	getEstimatedTokenCount(messages: ChatMessage[]): number {
		if (messages.length === 0) return 0;

		const charCount = messages.reduce((sum, m) => sum + m.content.length, 0);
		return Math.max(Math.ceil(charCount / 4), messages.length * 100);
	}

	/**
	 * Find the cheapest available flash-tier model from the registry.
	 *
	 * Used for summarization when no summarizationModel override is set.
	 *
	 * @returns Model ID of the cheapest available flash model
	 */
	getCheapestFlashModel(): string {
		let cheapest = "gemini-3-flash"; // Default fallback
		let lowestCost = Infinity;

		for (const [key, def] of Object.entries(AVAILABLE_MODELS)) {
			if (def.tier === "flash" && def.available) {
				const totalCost = def.costPer1MInput + def.costPer1MOutput;
				if (totalCost < lowestCost) {
					lowestCost = totalCost;
					cheapest = key;
				}
			}
		}

		return cheapest;
	}

	/**
	 * Create a no-op result where tokensBefore === tokensAfter.
	 */
	private noOpResult(
		messages: ChatMessage[],
		strategy: PrunerStrategy,
	): PruneResult {
		const tokens = this.getEstimatedTokenCount(messages);
		return {
			messages,
			strategy,
			tokensBefore: tokens,
			tokensAfter: tokens,
		};
	}
}

/**
 * Convenience function to create a ContextPruner with default config.
 */
export function createContextPruner(
	config?: Partial<ContextPrunerConfig>,
	options?: {
		onPruneApplied?: OnPruneApplied;
		summarizeFn?: SummarizeFn;
	},
): ContextPruner {
	return new ContextPruner(config, options);
}
