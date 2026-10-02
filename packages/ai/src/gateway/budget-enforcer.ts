/**
 * LLM Gateway — BudgetEnforcer
 *
 * Pre-request guard that checks tenant budget limits BEFORE executing
 * an LLM request. Prevents runaway AI costs by rejecting requests that
 * would exceed daily or monthly budget thresholds.
 *
 * Falls back to "allow" if the budget store is unreachable (graceful
 * degradation) — cost control is important but must never be a hard
 * blocker in production paths.
 *
 * @module @drenyra/ai/gateway
 */

import { loggers } from "../services/logger";
import { LLMGatewayError } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Budget limits per organization.
 * Defaults match aiCostRepository constants ($50 daily, $500 monthly).
 */
export interface BudgetLimits {
	dailyUsd: number;
	monthlyUsd: number;
}

/**
 * Interface for the budget store — the component that knows current spend.
 * Decoupled so we can swap between DB-backed (production) and in-memory
 * (testing/standalone) stores.
 */
export interface BudgetStore {
	/** Returns current spend summary for the given org, or global if orgId omitted. */
	getSpend(organizationId?: number): Promise<{
		dailySpent: number;
		monthlySpent: number;
	}>;
}

/**
 * Budget enforcement result.
 */
export interface BudgetCheckResult {
	allowed: boolean;
	daily: { spent: number; limit: number; remaining: number };
	monthly: { spent: number; limit: number; remaining: number };
	reason?: "daily" | "monthly" | "both";
}

// ─── Default limits ───────────────────────────────────────────────────────────

const DEFAULT_LIMITS: BudgetLimits = {
	dailyUsd: 50,
	monthlyUsd: 500,
};

// ─── BudgetEnforcer ───────────────────────────────────────────────────────────

/**
 * Pre-request budget enforcer.
 *
 * Checks tenant budget before allowing an LLM request through the gateway.
 * Compatible with aiCostRepository.getSummary() via the BudgetStore adapter.
 */
export class BudgetEnforcer {
	private limits: BudgetLimits;
	private store: BudgetStore;

	constructor(store: BudgetStore, limits?: Partial<BudgetLimits>) {
		this.store = store;
		this.limits = { ...DEFAULT_LIMITS, ...limits };
	}

	/**
	 * Check whether a request from this tenant is within budget.
	 * Returns a result — does NOT throw (caller decides how to handle).
	 *
	 * On store error, returns allowed=true with a warning log (graceful
	 * degradation).
	 */
	async check(organizationId?: number): Promise<BudgetCheckResult> {
		try {
			const { dailySpent, monthlySpent } =
				await this.store.getSpend(organizationId);

			const dailyRemaining = Math.max(0, this.limits.dailyUsd - dailySpent);
			const monthlyRemaining = Math.max(
				0,
				this.limits.monthlyUsd - monthlySpent,
			);

			const dailyExceeded = dailySpent >= this.limits.dailyUsd;
			const monthlyExceeded = monthlySpent >= this.limits.monthlyUsd;

			if (dailyExceeded && monthlyExceeded) {
				return {
					allowed: false,
					daily: {
						spent: dailySpent,
						limit: this.limits.dailyUsd,
						remaining: 0,
					},
					monthly: {
						spent: monthlySpent,
						limit: this.limits.monthlyUsd,
						remaining: 0,
					},
					reason: "both",
				};
			}

			if (dailyExceeded) {
				return {
					allowed: false,
					daily: {
						spent: dailySpent,
						limit: this.limits.dailyUsd,
						remaining: 0,
					},
					monthly: {
						spent: monthlySpent,
						limit: this.limits.monthlyUsd,
						remaining: monthlyRemaining,
					},
					reason: "daily",
				};
			}

			if (monthlyExceeded) {
				return {
					allowed: false,
					daily: {
						spent: dailySpent,
						limit: this.limits.dailyUsd,
						remaining: dailyRemaining,
					},
					monthly: {
						spent: monthlySpent,
						limit: this.limits.monthlyUsd,
						remaining: 0,
					},
					reason: "monthly",
				};
			}

			return {
				allowed: true,
				daily: {
					spent: dailySpent,
					limit: this.limits.dailyUsd,
					remaining: dailyRemaining,
				},
				monthly: {
					spent: monthlySpent,
					limit: this.limits.monthlyUsd,
					remaining: monthlyRemaining,
				},
			};
		} catch (err) {
			// Graceful degradation: if budget store is down, allow the request
			loggers.ai.warn("[BudgetEnforcer] Store unavailable — allowing request", {
				error: err instanceof Error ? err.message : "unknown",
				organizationId,
			});
			return {
				allowed: true,
				daily: {
					spent: 0,
					limit: this.limits.dailyUsd,
					remaining: this.limits.dailyUsd,
				},
				monthly: {
					spent: 0,
					limit: this.limits.monthlyUsd,
					remaining: this.limits.monthlyUsd,
				},
			};
		}
	}

	/**
	 * Throw LLMGatewayError if check fails.
	 * Convenience for the gateway service.
	 */
	async require(organizationId?: number): Promise<void> {
		const result = await this.check(organizationId);
		if (!result.allowed) {
			const boundary =
				result.reason === "both" ? "daily and monthly" : `${result.reason}`;
			throw new LLMGatewayError(
				`Budget exceeded: ${boundary} limit reached (daily: $${result.daily.spent.toFixed(2)} / $${result.daily.limit.toFixed(2)}, monthly: $${result.monthly.spent.toFixed(2)} / $${result.monthly.limit.toFixed(2)})`,
				"BUDGET_EXCEEDED",
				undefined,
				429,
				{
					dailySpent: result.daily.spent,
					dailyLimit: result.daily.limit,
					monthlySpent: result.monthly.spent,
					monthlyLimit: result.monthly.limit,
					reason: result.reason,
				},
			);
		}
	}

	/**
	 * Update limits at runtime.
	 */
	setLimits(limits: Partial<BudgetLimits>): void {
		this.limits = { ...this.limits, ...limits };
	}

	/**
	 * Get current limits.
	 */
	getLimits(): BudgetLimits {
		return { ...this.limits };
	}
}

// ─── BudgetStore adapter for aiCostRepository ─────────────────────────────────

/**
 * Creates a BudgetStore backed by the aiCostRepository.
 *
 * @example
 * ```ts
 * import { aiCostRepository } from "@drenyra/infrastructure/services/ai-cost";
 * const store = createRepositoryBudgetStore(aiCostRepository);
 * const enforcer = new BudgetEnforcer(store, { dailyUsd: 100 });
 * ```
 */
export function createRepositoryBudgetStore(repository: {
	getSummary: (organizationId?: number) => Promise<{
		daily: { spent: number };
		monthly: { spent: number };
	}>;
}): BudgetStore {
	return {
		async getSpend(organizationId?: number) {
			const summary = await repository.getSummary(organizationId);
			return {
				dailySpent: summary.daily.spent,
				monthlySpent: summary.monthly.spent,
			};
		},
	};
}

// ─── Default instance (standalone — no DB) ────────────────────────────────────

/**
 * In-memory BudgetStore for testing or standalone use.
 * Keeps a simple counter per org.
 */
export class InMemoryBudgetStore implements BudgetStore {
	private daily = new Map<number, number>();
	private monthly = new Map<number, number>();
	private lastDailyReset = Date.now();
	private lastMonthlyReset = Date.now();

	async getSpend(organizationId?: number) {
		this.maybeReset();

		const key = organizationId ?? 0;
		return {
			dailySpent: this.daily.get(key) ?? 0,
			monthlySpent: this.monthly.get(key) ?? 0,
		};
	}

	/**
	 * Record spend (for testing or standalone use).
	 */
	addSpend(amountUsd: number, organizationId?: number): void {
		this.maybeReset();
		const key = organizationId ?? 0;
		this.daily.set(key, (this.daily.get(key) ?? 0) + amountUsd);
		this.monthly.set(key, (this.monthly.get(key) ?? 0) + amountUsd);
	}

	private maybeReset(): void {
		const now = Date.now();
		// Reset daily every 24h
		if (now - this.lastDailyReset > 86_400_000) {
			this.daily.clear();
			this.lastDailyReset = now;
		}
		// Reset monthly every 30d
		if (now - this.lastMonthlyReset > 2_592_000_000) {
			this.monthly.clear();
			this.lastMonthlyReset = now;
		}
	}
}

/**
 * Default budget enforcer using in-memory store.
 * For production, use `createRepositoryBudgetStore(aiCostRepository)`.
 */
const defaultStore = new InMemoryBudgetStore();
export const budgetEnforcer = new BudgetEnforcer(defaultStore, DEFAULT_LIMITS);
