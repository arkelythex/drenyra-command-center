/**
 * Reconciliation Shadow Metrics — tracks and evaluates shadow mode comparison
 * between local engine and Go worker results.
 */

import { reconciliationShadowRuns } from "@arkelythex/persistence/schema";
import { db } from "@arkelythex/persistence/client";
import { desc, eq } from "@arkelythex/persistence/query";
import { SecureLogger } from "@arkelythex/shared/secure-logger";
import type {
	ReconciliationShadowCutoverDecision,
	ReconciliationShadowCutoverEvaluation,
	ReconciliationShadowMetricsSnapshot,
	ShadowRunPayload,
	ShadowTotals,
} from "./reconciliation.types";

const SHADOW_MODE_ENABLED =
	process.env.ARKELYTHEX_RECONCILIATION_SHADOW_MODE === "1";
const SHADOW_TOLERANCE_CENTS = Number.parseInt(
	process.env.ARKELYTHEX_RECONCILIATION_SHADOW_TOLERANCE_CENTS ?? "10",
	10,
);
const SHADOW_MIN_SUCCESS_RUNS = Number.parseInt(
	process.env.ARKELYTHEX_RECONCILIATION_SHADOW_MIN_SUCCESS_RUNS ?? "20",
	10,
);
const SHADOW_MAX_DISCREPANCY_RATE_BPS = Number.parseInt(
	process.env.ARKELYTHEX_RECONCILIATION_SHADOW_MAX_DISCREPANCY_RATE_BPS ?? "500",
	10,
);
const SHADOW_MAX_FAILURE_RATE_BPS = Number.parseInt(
	process.env.ARKELYTHEX_RECONCILIATION_SHADOW_MAX_FAILURE_RATE_BPS ?? "1000",
	10,
);

const logger = SecureLogger.namespace("ReconciliationShadowMetrics");

const shadowTotals: ShadowTotals = {
	runs: 0,
	failedRuns: 0,
	matchedByLocalEngine: 0,
	matchedByGoWorker: 0,
	discrepancies: 0,
};

const shadowByCompany = new Map<string, ShadowTotals>();

export class ShadowMetricsService {
	static getTotals(): ShadowTotals {
		return { ...shadowTotals };
	}

	static getByCompany(companyId: string): ShadowTotals | undefined {
		return shadowByCompany.get(companyId);
	}

	static getOrCreateCompany(companyId: string): ShadowTotals {
		const current = shadowByCompany.get(companyId);
		if (current) return current;

		const created: ShadowTotals = {
			runs: 0,
			failedRuns: 0,
			matchedByLocalEngine: 0,
			matchedByGoWorker: 0,
			discrepancies: 0,
		};
		shadowByCompany.set(companyId, created);
		return created;
	}

	static isEnabled(): boolean {
		return SHADOW_MODE_ENABLED;
	}

	static getToleranceCents(): number {
		return Number.isFinite(SHADOW_TOLERANCE_CENTS)
			? Math.max(SHADOW_TOLERANCE_CENTS, 0)
			: 10;
	}

	static async getSnapshot(
		companyId?: string,
	): Promise<ReconciliationShadowMetricsSnapshot> {
		const base = {
			enabled: SHADOW_MODE_ENABLED,
			toleranceCents: ShadowMetricsService.getToleranceCents(),
			runs: shadowTotals.runs,
			failedRuns: shadowTotals.failedRuns,
			matchedByLocalEngine: shadowTotals.matchedByLocalEngine,
			matchedByGoWorker: shadowTotals.matchedByGoWorker,
			discrepancies: shadowTotals.discrepancies,
		};

		const byCompany = companyId
			? (() => {
					const metrics = shadowByCompany.get(companyId);
					return metrics ? [{ companyId, ...metrics }] : [];
				})()
			: Array.from(shadowByCompany.entries()).map(([id, metrics]) => ({
					companyId: id,
					...metrics,
				}));

		const persistedRuns = await db.query.reconciliationShadowRuns.findMany({
			where: companyId
				? eq(reconciliationShadowRuns.companyId, companyId)
				: undefined,
			orderBy: [desc(reconciliationShadowRuns.createdAt)],
			limit: 50,
			columns: {
				id: true,
				companyId: true,
				accountId: true,
				status: true,
				localMatchedCount: true,
				goMatchedCount: true,
				discrepancyCount: true,
				toleranceCents: true,
				errorMessage: true,
				createdAt: true,
			},
		});

		return {
			...base,
			byCompany,
			persistedRuns: persistedRuns.map((item) => ({
				id: item.id,
				companyId: item.companyId,
				accountId: item.accountId,
				status: item.status as "SUCCESS" | "FAILED",
				localMatchedCount: item.localMatchedCount,
				goMatchedCount: item.goMatchedCount,
				discrepancyCount: item.discrepancyCount,
				toleranceCents: item.toleranceCents,
				errorMessage: item.errorMessage,
				createdAt: item.createdAt,
			})),
		};
	}

	static async evaluateCutover(
		companyId?: string,
		windowRuns = 30,
	): Promise<ReconciliationShadowCutoverEvaluation> {
		const sanitizedWindowRuns = Number.isFinite(windowRuns)
			? Math.max(1, Math.min(200, Math.floor(windowRuns)))
			: 30;
		const minSuccessfulRuns = Number.isFinite(SHADOW_MIN_SUCCESS_RUNS)
			? Math.max(SHADOW_MIN_SUCCESS_RUNS, 1)
			: 20;
		const maxAllowedDiscrepancyRate = Number.isFinite(
			SHADOW_MAX_DISCREPANCY_RATE_BPS,
		)
			? Math.max(SHADOW_MAX_DISCREPANCY_RATE_BPS, 0) / 10_000
			: 0.05;
		const maxAllowedFailureRate = Number.isFinite(SHADOW_MAX_FAILURE_RATE_BPS)
			? Math.max(SHADOW_MAX_FAILURE_RATE_BPS, 0) / 10_000
			: 0.1;

		const runs = await db.query.reconciliationShadowRuns.findMany({
			where: companyId
				? eq(reconciliationShadowRuns.companyId, companyId)
				: undefined,
			orderBy: [desc(reconciliationShadowRuns.createdAt)],
			limit: sanitizedWindowRuns,
			columns: {
				status: true,
				localMatchedCount: true,
				discrepancyCount: true,
				createdAt: true,
			},
		});

		const successfulRuns = runs.filter((run) => run.status === "SUCCESS");
		const failedRuns = runs.length - successfulRuns.length;
		const localMatchedCount = successfulRuns.reduce(
			(acc, run) => acc + run.localMatchedCount,
			0,
		);
		const discrepancyCount = successfulRuns.reduce(
			(acc, run) => acc + run.discrepancyCount,
			0,
		);
		const successRate =
			runs.length > 0 ? successfulRuns.length / runs.length : 0;
		const failureRate = runs.length > 0 ? failedRuns / runs.length : 0;
		const discrepancyRate =
			localMatchedCount > 0 ? discrepancyCount / localMatchedCount : 0;

		const base: Omit<
			ReconciliationShadowCutoverEvaluation,
			"decision" | "reason"
		> = {
			enabled: SHADOW_MODE_ENABLED,
			companyId: companyId ?? null,
			windowRuns: sanitizedWindowRuns,
			evaluatedRuns: runs.length,
			successfulRuns: successfulRuns.length,
			failedRuns,
			successRate,
			failureRate,
			discrepancyRate,
			maxAllowedDiscrepancyRate,
			maxAllowedFailureRate,
			minSuccessfulRuns,
			evaluatedAt: runs[0]?.createdAt ?? null,
		};

		if (!SHADOW_MODE_ENABLED) {
			return {
				...base,
				decision: "NO_GO" as ReconciliationShadowCutoverDecision,
				reason: "SHADOW_MODE_DISABLED",
			};
		}

		if (successfulRuns.length < minSuccessfulRuns) {
			return {
				...base,
				decision: "INSUFFICIENT_DATA" as ReconciliationShadowCutoverDecision,
				reason: "INSUFFICIENT_SUCCESSFUL_RUNS",
			};
		}

		if (failureRate > maxAllowedFailureRate) {
			return {
				...base,
				decision: "NO_GO" as ReconciliationShadowCutoverDecision,
				reason: "FAILURE_RATE_EXCEEDED",
			};
		}

		if (discrepancyRate > maxAllowedDiscrepancyRate) {
			return {
				...base,
				decision: "NO_GO" as ReconciliationShadowCutoverDecision,
				reason: "DISCREPANCY_RATE_EXCEEDED",
			};
		}

		return {
			...base,
			decision: "GO" as ReconciliationShadowCutoverDecision,
			reason: "CUTOVER_GATES_PASSED",
		};
	}

	static async persistShadowRun(payload: ShadowRunPayload): Promise<void> {
		try {
			await db.insert(reconciliationShadowRuns).values({
				companyId: payload.companyId,
				accountId: payload.accountId,
				status: payload.status,
				localMatchedCount: payload.localMatchedCount,
				goMatchedCount: payload.goMatchedCount,
				discrepancyCount: payload.discrepancyCount,
				toleranceCents: payload.toleranceCents,
				errorMessage: payload.errorMessage,
				startedAt: payload.startedAt,
				completedAt: payload.completedAt,
			});
		} catch (error: unknown) {
			logger.error("Failed to persist reconciliation shadow run", {
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}
}
