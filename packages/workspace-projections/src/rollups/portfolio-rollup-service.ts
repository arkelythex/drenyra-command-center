// ─── Enhanced Portfolio Rollup Service ───────────────────────────────────────

import { PROJECTED_RISK_TIER } from "@drenyra/workspace-domain";
import type {
	AttentionRollup,
	ExecutionId,
	OperationalState,
	ProjectedRiskTier,
} from "@drenyra/workspace-domain";
import { buildAttentionProjection } from "../projections/attention-projection";
import type { PortfolioRollupInput } from "./types";
import { findNearestDeadline } from "./deadline";
import { generateRollupReasons } from "./reason-generator";

// ─── Risk ordering ──────────────────────────────────────────────────────────

const RISK_ORDER: Record<ProjectedRiskTier, number> = {
	[PROJECTED_RISK_TIER.R0]: 0,
	[PROJECTED_RISK_TIER.R1]: 1,
	[PROJECTED_RISK_TIER.R2]: 2,
	[PROJECTED_RISK_TIER.R3]: 3,
};

function maxRisk(
	a: ProjectedRiskTier,
	b: ProjectedRiskTier,
): ProjectedRiskTier {
	return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeExposure(
	exposureMap: ReadonlyMap<ExecutionId, number> | undefined,
): string | undefined {
	if (!exposureMap || exposureMap.size === 0) return undefined;

	let total = 0;
	for (const amount of exposureMap.values()) {
		total += amount;
	}

	// Format as "S/ 125,000.00" style string
	return formatMoney(total);
}

function formatMoney(cents: number): string {
	const soles = cents / 100;
	return `S/ ${soles.toLocaleString("es-PE", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

function countUniqueCompanies(
	companyMap: ReadonlyMap<ExecutionId, readonly string[]> | undefined,
): number {
	if (!companyMap || companyMap.size === 0) return 0;

	const allCompanies = new Set<string>();
	for (const companies of companyMap.values()) {
		for (const c of companies) {
			allCompanies.add(c);
		}
	}

	return allCompanies.size;
}

function highestRiskFromStates(
	states: ReadonlyMap<ExecutionId, OperationalState>,
): ProjectedRiskTier {
	let highest: ProjectedRiskTier = PROJECTED_RISK_TIER.R0;
	for (const state of states.values()) {
		highest = maxRisk(highest, state.risk);
	}
	return highest;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function buildEnhancedPortfolioRollup(
	input: PortfolioRollupInput,
): AttentionRollup {
	// 1. Base rollup from attention projection
	const base = buildAttentionProjection(input.executionStates);

	// 2. estimatedExposure from exposureMap
	const estimatedExposure = computeExposure(input.exposureMap);

	// 3. nearestDeadline from input.deadlines
	const nearestDeadlineObj = input.deadlines
		? findNearestDeadline(input.deadlines)
		: null;

	// 4. affectedCompanies from companyMap
	const affectedCompanies = countUniqueCompanies(input.companyMap);

	// 5. Generate enriched topReasons
	const topReasons = generateRollupReasons(input.executionStates);

	// 6. highestRisk from all states
	const highestRisk = highestRiskFromStates(input.executionStates);

	// 7. Build enriched rollup with conditional optional properties
	return {
		lifecycle: base.lifecycle,
		counts: base.counts,
		highestRisk,
		affectedCompanies,
		topReasons,
		...(nearestDeadlineObj
			? { nearestDeadline: nearestDeadlineObj.deadline }
			: {}),
		...(estimatedExposure ? { estimatedExposure } : {}),
	};
}
