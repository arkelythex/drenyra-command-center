// ─── Rollup Domain Types (PR4) ─────────────────────────────────────────────

import type {
	AttentionState,
	ProjectedRiskTier,
	ExecutionId,
} from "@drenyra/workspace-domain";
import type { RollupReason, OperationalState } from "@drenyra/workspace-domain";

// ─── Materiality Level ──────────────────────────────────────────────────────

/**
 * Severity weighted by business impact.
 */
export type MaterialityLevel = "low" | "medium" | "high" | "critical";

// ─── Materiality Input ──────────────────────────────────────────────────────

export interface MaterialityInput {
	readonly severity: AttentionState;
	readonly affectedCompanies: number;
	readonly estimatedExposure?: number;
	readonly riskTier: ProjectedRiskTier;
	readonly isRegulatoryDeadline: boolean;
}

// ─── Execution Deadline ─────────────────────────────────────────────────────

export interface ExecutionDeadline {
	readonly executionId: ExecutionId;
	readonly deadline: string; // ISO 8601
	readonly label: string;
	readonly companyId?: string;
	readonly companyName?: string;
}

// ─── Weighted Rollup Reason ─────────────────────────────────────────────────

export interface WeightedRollupReason extends RollupReason {
	readonly materiality: MaterialityLevel;
	readonly exposure?: number;
}

// ─── Portfolio Rollup Input ─────────────────────────────────────────────────

export interface PortfolioRollupInput {
	readonly executionStates: ReadonlyMap<ExecutionId, OperationalState>;
	readonly deadlines?: readonly ExecutionDeadline[];
	readonly exposureMap?: ReadonlyMap<ExecutionId, number>;
	readonly companyMap?: ReadonlyMap<ExecutionId, readonly string[]>;
}
