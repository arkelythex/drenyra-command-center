/**
 * Context Monitor Service
 *
 * Tracks cumulative token usage per runId, resolves model context windows
 * from the model registry, and signals when usage exceeds a configurable
 * threshold (default 95%). All methods are non-blocking — errors are
 * caught, logged, and swallowed.
 *
 * @module @drenyra/ai/context-monitor
 */

import { AVAILABLE_MODELS } from "../ai/model-registry";
import { loggers } from "../logger";
import type { SessionStore } from "../session/session-store";
import type {
	ContextMonitorConfig,
	ContextUsage,
	RunUsage,
} from "./context-monitor.types";

// Safe default context window for unknown models (matches Claude's window)
const UNKNOWN_MODEL_CONTEXT_WINDOW = 200_000;

/**
 * Default configuration used when no config is provided.
 */
const DEFAULT_CONFIG: ContextMonitorConfig = {
	enabled: true,
	threshold: 0.95,
};

/**
 * ContextMonitor class.
 *
 * Tracks token usage per `runId` in an in-memory Map and optionally
 * persists snapshots via `SessionStore.appendEvent()`.
 *
 * @example
 * ```ts
 * const monitor = new ContextMonitor(sessionStore, { threshold: 0.9 });
 * monitor.trackRequest("run-abc", "gemini-3-flash", {
 *   promptTokens: 150,
 *   completionTokens: 50,
 * });
 * const needsPrune = monitor.shouldPrune("run-abc");
 * ```
 */
export class ContextMonitor {
	private runs: Map<string, InternalRunUsage> = new Map();
	private config: ContextMonitorConfig;
	private sessionStore?: SessionStore;

	constructor(
		sessionStore?: SessionStore,
		config?: Partial<ContextMonitorConfig>,
	) {
		this.sessionStore = sessionStore;
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Track token usage for a run.
	 *
	 * Updates the cumulative token count for the given runId and resolves
	 * the model's context window from `AVAILABLE_MODELS`. Optionally persists
	 * a `context_usage_snapshot` event via SessionStore.
	 *
	 * Never throws — errors are caught, logged, and swallowed.
	 */
	trackRequest(
		runId: string,
		modelId: string,
		usage: { promptTokens: number; completionTokens: number },
	): void {
		try {
			const contextWindow = this.resolveContextWindow(modelId);
			const totalTokens = usage.promptTokens + usage.completionTokens;

			const existing = this.runs.get(runId);
			if (existing) {
				existing.totalTokens += totalTokens;
				existing.promptTokens += usage.promptTokens;
				existing.completionTokens += usage.completionTokens;
				existing.modelId = modelId;
				existing.contextWindow = contextWindow;
			} else {
				this.runs.set(runId, {
					runId,
					modelId,
					contextWindow,
					totalTokens,
					promptTokens: usage.promptTokens,
					completionTokens: usage.completionTokens,
					thresholdReached: false,
				});
			}

			// Persist usage snapshot if session store is configured
			this.persistUsageSnapshot(runId, modelId, contextWindow).catch((err) => {
				loggers.ai.error("ContextMonitor: failed to persist usage snapshot", {
					runId,
					error: String(err),
				});
			});
		} catch (err) {
			loggers.ai.error("ContextMonitor: trackRequest failed", {
				runId,
				error: String(err),
			});
		}
	}

	/**
	 * Check whether a run's context usage has crossed the threshold.
	 *
	 * Returns `true` if `usageRatio >= threshold`. The signal fires at most
	 * once per threshold crossing — subsequent calls return `true` but do
	 * not re-emit the signal.
	 *
	 * Never throws — errors are caught, logged, and `false` is returned.
	 */
	shouldPrune(runId: string): boolean {
		try {
			const run = this.runs.get(runId);
			if (!run) return false;
			if (run.contextWindow <= 0) return false;

			const usageRatio = run.totalTokens / run.contextWindow;

			if (usageRatio >= this.config.threshold && !run.thresholdReached) {
				run.thresholdReached = true;

				// Persist threshold event if session store is configured
				this.persistThresholdEvent(runId, run, usageRatio).catch((err) => {
					loggers.ai.error(
						"ContextMonitor: failed to persist threshold event",
						{ runId, error: String(err) },
					);
				});

				return true;
			}

			// Return true if threshold was already reached (so caller knows
			// they still need to prune), but we don't emit again
			return run.thresholdReached;
		} catch (err) {
			loggers.ai.error("ContextMonitor: shouldPrune failed", {
				runId,
				error: String(err),
			});
			return false;
		}
	}

	/**
	 * Get current usage snapshot for a run.
	 *
	 * Returns null if the run is not being tracked.
	 * Never throws.
	 */
	getRunUsage(runId: string): ContextUsage | null {
		try {
			const run = this.runs.get(runId);
			if (!run) return null;

			return {
				totalTokens: run.totalTokens,
				promptTokens: run.promptTokens,
				completionTokens: run.completionTokens,
				modelContextWindow: run.contextWindow,
				modelId: run.modelId,
				usageRatio:
					run.contextWindow > 0 ? run.totalTokens / run.contextWindow : 0,
				lastChecked: new Date(),
			};
		} catch (err) {
			loggers.ai.error("ContextMonitor: getRunUsage failed", {
				runId,
				error: String(err),
			});
			return null;
		}
	}

	/**
	 * Reset tracking for a run.
	 *
	 * Clears all accumulated usage data for the given runId.
	 * Never throws.
	 */
	resetRun(runId: string): void {
		try {
			this.runs.delete(runId);
		} catch (err) {
			loggers.ai.error("ContextMonitor: resetRun failed", {
				runId,
				error: String(err),
			});
		}
	}

	/**
	 * Resolve the model's context window from AVAILABLE_MODELS.
	 * Falls back to 200K for unknown models.
	 */
	private resolveContextWindow(modelId: string): number {
		const modelDef = AVAILABLE_MODELS[modelId as keyof typeof AVAILABLE_MODELS];
		if (modelDef?.contextWindow) {
			return modelDef.contextWindow;
		}

		loggers.ai.warn(
			"ContextMonitor: unknown model, using fallback context window",
			{
				modelId,
				fallbackWindow: UNKNOWN_MODEL_CONTEXT_WINDOW,
			},
		);
		return UNKNOWN_MODEL_CONTEXT_WINDOW;
	}

	/**
	 * Persist a context_usage_snapshot event via SessionStore.
	 * Non-blocking — errors are caught and logged.
	 */
	private async persistUsageSnapshot(
		runId: string,
		modelId: string,
		contextWindow: number,
	): Promise<void> {
		if (!this.sessionStore) return;

		const run = this.runs.get(runId);
		if (!run) return;

		await this.sessionStore.appendEvent(runId, {
			runId,
			eventType: "context_usage_snapshot",
			payload: {
				cumulativeTokens: run.totalTokens,
				contextWindow: run.contextWindow,
				usageRatio:
					run.contextWindow > 0 ? run.totalTokens / run.contextWindow : 0,
				model: modelId,
				promptTokens: run.promptTokens,
				completionTokens: run.completionTokens,
			},
			companyId: "00000000-0000-0000-0000-000000000000",
		});
	}

	/**
	 * Persist a context_threshold_reached event via SessionStore.
	 * Non-blocking — errors are caught and logged.
	 */
	private async persistThresholdEvent(
		runId: string,
		run: InternalRunUsage,
		usageRatio: number,
	): Promise<void> {
		if (!this.sessionStore) return;

		await this.sessionStore.appendEvent(runId, {
			runId,
			eventType: "context_threshold_reached",
			payload: {
				usageRatio,
				cumulativeTokens: run.totalTokens,
				contextWindow: run.contextWindow,
				model: run.modelId,
			},
			companyId: "00000000-0000-0000-0000-000000000000",
		});
	}
}

/**
 * Internal per-run tracking state (private to the service).
 */
interface InternalRunUsage {
	runId: string;
	modelId: string;
	contextWindow: number;
	totalTokens: number;
	promptTokens: number;
	completionTokens: number;
	thresholdReached: boolean;
}
