/**
 * FiscalAnomalyEngine — orchestrates multiple anomaly detection strategies
 * and publishes results to the AgentEventBus.
 *
 * Design:
 * - Strategies register with the engine; each is a self-contained detection module
 * - runAll() executes all strategies, collects results with per-strategy error isolation
 * - runAllFlat() deduplicates anomalies by ID (keeps highest severity)
 * - Event bus integration is optional — if not provided, engine works standalone
 * - Performance tracking is optional — enabled via options.trackPerformance
 */

import type { AgentEventBus, FiscalEventType } from "../mastra/event-bus";
import type { AgentContext } from "../types/agent-context";
import type {
	Anomaly,
	AnomalySeverity,
	AnomalyStrategy,
	FiscalAnomalyEngineOptions,
	StrategyRunResult,
} from "./types";
import { compareSeverity, meetsThreshold } from "./types";

// ─── Engine ────────────────────────────────────────────────────────

export class FiscalAnomalyEngine {
	private readonly strategies = new Map<string, AnomalyStrategy>();
	private readonly eventBus?: AgentEventBus;
	private readonly publishThreshold: AnomalySeverity;
	private readonly trackPerformance: boolean;

	constructor(
		initialStrategies: AnomalyStrategy[] = [],
		eventBus?: AgentEventBus,
		options?: FiscalAnomalyEngineOptions,
	) {
		this.eventBus = eventBus;
		this.publishThreshold = options?.publishThreshold ?? "medium";
		this.trackPerformance = options?.trackPerformance ?? false;

		for (const strategy of initialStrategies) {
			this.strategies.set(strategy.id, strategy);
		}
	}

	// ─── Strategy lifecycle ──────────────────────────────────────

	addStrategy(strategy: AnomalyStrategy): void {
		this.strategies.set(strategy.id, strategy);
	}

	removeStrategy(id: string): boolean {
		return this.strategies.delete(id);
	}

	getStrategy(id: string): AnomalyStrategy | undefined {
		return this.strategies.get(id);
	}

	listStrategies(): AnomalyStrategy[] {
		return Array.from(this.strategies.values());
	}

	replaceStrategy(strategy: AnomalyStrategy): void {
		this.strategies.set(strategy.id, strategy);
	}

	// ─── Execution ───────────────────────────────────────────────

	/**
	 * Run ALL registered strategies.
	 * Per-strategy error isolation: one failing strategy does not block others.
	 */
	async runAll(
		data: unknown,
		context: AgentContext,
	): Promise<StrategyRunResult[]> {
		const results: StrategyRunResult[] = [];

		for (const strategy of this.strategies.values()) {
			const result = await this.runSingle(strategy, data, context);
			results.push(result);

			// Publish qualifying anomalies to event bus
			if (this.eventBus && result.anomalies.length > 0) {
				await this.publishAnomalies(result);
			}
		}

		return results;
	}

	/**
	 * Run all strategies and return a flat deduplicated list.
	 * When the same entity/metric has multiple anomalies, keeps the highest severity.
	 */
	async runAllFlat(data: unknown, context: AgentContext): Promise<Anomaly[]> {
		const results = await this.runAll(data, context);

		// Collect all anomalies into a dedup map keyed by entityType:entityId:metric
		const dedup = new Map<string, Anomaly>();

		for (const result of results) {
			for (const anomaly of result.anomalies) {
				const key = `${anomaly.entityType}:${anomaly.entityId}:${anomaly.metric}`;
				const existing = dedup.get(key);
				if (
					!existing ||
					compareSeverity(anomaly.severity, existing.severity) > 0
				) {
					dedup.set(key, anomaly);
				}
			}
		}

		return Array.from(dedup.values());
	}

	/**
	 * Run a specific strategy by ID.
	 */
	async runStrategy(
		id: string,
		data: unknown,
		context: AgentContext,
	): Promise<StrategyRunResult> {
		const strategy = this.strategies.get(id);
		if (!strategy) {
			return {
				strategyId: id,
				strategyName: id,
				anomalies: [],
				durationMs: 0,
				error: `Strategy "${id}" not found`,
			};
		}

		const result = await this.runSingle(strategy, data, context);

		if (this.eventBus && result.anomalies.length > 0) {
			await this.publishAnomalies(result);
		}

		return result;
	}

	// ─── Internal helpers ───────────────────────────────────────

	private async runSingle(
		strategy: AnomalyStrategy,
		data: unknown,
		context: AgentContext,
	): Promise<StrategyRunResult> {
		const start = this.trackPerformance ? performance.now() : 0;

		try {
			const raw = await strategy.execute(data, context);
			const minSev = strategy.minSeverity;
			const anomalies = minSev
				? raw.filter((a) => meetsThreshold(a, minSev))
				: raw;

			const durationMs = this.trackPerformance ? performance.now() - start : 0;

			return {
				strategyId: strategy.id,
				strategyName: strategy.name,
				anomalies,
				durationMs,
			};
		} catch (error) {
			const durationMs = this.trackPerformance ? performance.now() - start : 0;

			return {
				strategyId: strategy.id,
				strategyName: strategy.name,
				anomalies: [],
				durationMs,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	private async publishAnomalies(result: StrategyRunResult): Promise<void> {
		if (!this.eventBus) return;

		const publishable = result.anomalies.filter((a) =>
			meetsThreshold(a, this.publishThreshold),
		);

		// Create a minimal context for publishing
		const publishContext: AgentContext = {
			tenantId: "system",
			userId: "system",
			organizationId: "system",
			companyId: "system",
			ruc: "00000000000",
			traceId: `anomaly-batch-${Date.now()}`,
		};

		for (const anomaly of publishable) {
			await this.eventBus.publish(
				"fiscal.anomaly.detected" as FiscalEventType,
				{
					strategyId: result.strategyId,
					strategyName: result.strategyName,
					anomaly,
				},
				publishContext,
				{ source: `anomaly-engine:${result.strategyId}` },
			);
		}
	}
}
