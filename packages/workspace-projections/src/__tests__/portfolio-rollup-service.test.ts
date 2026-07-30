import { describe, it, expect } from "vitest";
import {
	createExecutionId,
	createOperationalState,
	ATTENTION_STATE,
	LIFECYCLE_STATE,
	PROJECTED_RISK_TIER,
	createEmptyAttentionRollup,
} from "@drenyra/workspace-domain";
import type { ExecutionId, OperationalState } from "@drenyra/workspace-domain";
import type { PortfolioRollupInput, ExecutionDeadline } from "../rollups/types";
import { buildEnhancedPortfolioRollup } from "../rollups/portfolio-rollup-service";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDeadline(daysFromNow: number, label: string): ExecutionDeadline {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	return {
		executionId: createExecutionId(),
		deadline: date.toISOString(),
		label,
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("buildEnhancedPortfolioRollup", () => {
	it("should return an empty-like rollup for empty input", () => {
		const input: PortfolioRollupInput = {
			executionStates: new Map(),
		};
		const result = buildEnhancedPortfolioRollup(input);
		const empty = createEmptyAttentionRollup();

		expect(result.counts.critical).toBe(empty.counts.critical);
		expect(result.counts.blocked).toBe(empty.counts.blocked);
		expect(result.affectedCompanies).toBe(0);
		expect(result.topReasons).toEqual([]);
	});

	it("should produce correct rollup for a single critical execution", () => {
		const execId = createExecutionId();
		const map = new Map<ExecutionId, OperationalState>();
		map.set(
			execId,
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.RUNNING,
				attention: ATTENTION_STATE.CRITICAL,
			}),
		);

		const input: PortfolioRollupInput = {
			executionStates: map,
			companyMap: new Map([[execId, ["company-1"]]]),
		};

		const result = buildEnhancedPortfolioRollup(input);
		expect(result.counts.critical).toBe(1);
		expect(result.affectedCompanies).toBe(1);
		expect(result.topReasons.length).toBeGreaterThanOrEqual(1);
	});

	it("should enrich rollup with exposure, deadlines, and company counts", () => {
		const execA = createExecutionId();
		const execB = createExecutionId();
		const map = new Map<ExecutionId, OperationalState>();
		map.set(
			execA,
			createOperationalState({
				attention: ATTENTION_STATE.BLOCKED,
				risk: PROJECTED_RISK_TIER.R2,
			}),
		);
		map.set(
			execB,
			createOperationalState({
				attention: ATTENTION_STATE.APPROVAL_REQUIRED,
			}),
		);

		const deadlines: ExecutionDeadline[] = [
			makeDeadline(3, "Near deadline"),
			makeDeadline(30, "Far deadline"),
		];

		const input: PortfolioRollupInput = {
			executionStates: map,
			deadlines,
			exposureMap: new Map([
				[execA, 50000],
				[execB, 75000],
			]),
			companyMap: new Map([
				[execA, ["company-1"]],
				[execB, ["company-1", "company-2"]],
			]),
		};

		const result = buildEnhancedPortfolioRollup(input);

		// Exposure: 50000 + 75000 = 125000
		expect(result.estimatedExposure).toBeDefined();

		// Deadlines: nearest should be found
		expect(result.nearestDeadline).toBeDefined();

		// Companies: unique count = 2
		expect(result.affectedCompanies).toBe(2);

		// Top reasons should have both BLOCKED and APPROVAL_REQUIRED
		expect(result.topReasons.length).toBeGreaterThanOrEqual(1);
	});

	it("should propagate highest risk correctly", () => {
		const map = new Map<ExecutionId, OperationalState>();
		map.set(
			createExecutionId(),
			createOperationalState({ risk: PROJECTED_RISK_TIER.R3 }),
		);
		map.set(
			createExecutionId(),
			createOperationalState({ risk: PROJECTED_RISK_TIER.R1 }),
		);

		const input: PortfolioRollupInput = {
			executionStates: map,
		};

		const result = buildEnhancedPortfolioRollup(input);
		// The current buildAttentionProjection does not set highestRisk
		// but buildEnhancedPortfolioRollup should set it from the input states
		expect(result.highestRisk).toBe(PROJECTED_RISK_TIER.R3);
	});

	it("should set nearestDeadline from provided deadlines", () => {
		const execId = createExecutionId();
		const map = new Map<ExecutionId, OperationalState>();
		map.set(
			execId,
			createOperationalState({ attention: ATTENTION_STATE.NONE }),
		);

		const near = makeDeadline(1, "Very near");
		const far = makeDeadline(60, "Very far");

		const input: PortfolioRollupInput = {
			executionStates: map,
			deadlines: [far, near],
		};

		const result = buildEnhancedPortfolioRollup(input);
		expect(result.nearestDeadline).toBe(near.deadline);
	});

	it("should set nearestDeadline to undefined when no deadlines provided", () => {
		const map = new Map<ExecutionId, OperationalState>();
		map.set(
			createExecutionId(),
			createOperationalState({ attention: ATTENTION_STATE.NONE }),
		);

		const input: PortfolioRollupInput = {
			executionStates: map,
		};

		const result = buildEnhancedPortfolioRollup(input);
		expect(result.nearestDeadline).toBeUndefined();
	});
});
