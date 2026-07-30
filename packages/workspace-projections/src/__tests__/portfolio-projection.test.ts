import { describe, it, expect } from "vitest";
import {
	createEmptyAttentionRollup,
	createOperationalState,
	LIFECYCLE_STATE,
	ATTENTION_STATE,
	createExecutionId,
} from "@drenyra/workspace-domain";
import type {
	AttentionRollup,
	ExecutionId,
	OperationalState,
} from "@drenyra/workspace-domain";
import { buildAttentionProjection } from "../projections/attention-projection";
import { buildPortfolioProjection } from "../projections/portfolio-projection";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("buildPortfolioProjection", () => {
	it("should return empty rollup for empty array", () => {
		const result = buildPortfolioProjection([]);
		const empty = createEmptyAttentionRollup();
		expect(result.counts.critical).toBe(empty.counts.critical);
		expect(result.counts.blocked).toBe(empty.counts.blocked);
	});

	it("should pass through a single rollup", () => {
		const map = new Map<ExecutionId, OperationalState>();
		map.set(
			createExecutionId(),
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.FAILED,
			}),
		);
		const rollup = buildAttentionProjection(map);

		const result = buildPortfolioProjection([rollup]);
		expect(result.counts.failed).toBe(rollup.counts.failed);
	});

	it("should aggregate multiple rollups", () => {
		const map1 = new Map<ExecutionId, OperationalState>();
		map1.set(
			createExecutionId(),
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.RUNNING,
				attention: ATTENTION_STATE.CRITICAL,
			}),
		);

		const map2 = new Map<ExecutionId, OperationalState>();
		map2.set(
			createExecutionId(),
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.FAILED,
			}),
		);

		const rollups: AttentionRollup[] = [
			buildAttentionProjection(map1),
			buildAttentionProjection(map2),
		];

		const result = buildPortfolioProjection(rollups);
		expect(result.counts.critical).toBe(1);
		expect(result.counts.failed).toBe(1);
	});

	it("should accumulate working counts across rollups", () => {
		const map1 = new Map<ExecutionId, OperationalState>();
		map1.set(
			createExecutionId(),
			createOperationalState({ lifecycle: LIFECYCLE_STATE.RUNNING }),
		);
		map1.set(
			createExecutionId(),
			createOperationalState({ lifecycle: LIFECYCLE_STATE.VERIFYING }),
		);

		const map2 = new Map<ExecutionId, OperationalState>();
		map2.set(
			createExecutionId(),
			createOperationalState({ lifecycle: LIFECYCLE_STATE.WAITING }),
		);

		const rollups: AttentionRollup[] = [
			buildAttentionProjection(map1),
			buildAttentionProjection(map2),
		];

		const result = buildPortfolioProjection(rollups);
		expect(result.counts.working).toBe(3);
	});
});
