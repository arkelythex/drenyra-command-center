import { describe, it, expect } from "vitest";
import {
	createExecutionId,
	createOperationalState,
	LIFECYCLE_STATE,
	ATTENTION_STATE,
	createEmptyAttentionRollup,
} from "@drenyra/workspace-domain";
import type { ExecutionId, OperationalState } from "@drenyra/workspace-domain";
import { buildAttentionProjection } from "../projections/attention-projection";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("buildAttentionProjection", () => {
	it("should return an empty rollup for an empty map", () => {
		const result = buildAttentionProjection(new Map());
		const empty = createEmptyAttentionRollup();
		expect(result.counts.critical).toBe(empty.counts.critical);
		expect(result.counts.blocked).toBe(empty.counts.blocked);
		expect(result.counts.working).toBe(empty.counts.working);
	});

	it("should count running + critical attention as critical", () => {
		const execId = createExecutionId();
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.RUNNING,
			attention: ATTENTION_STATE.CRITICAL,
		});
		const map = new Map<ExecutionId, OperationalState>();
		map.set(execId, state);

		const result = buildAttentionProjection(map);
		expect(result.counts.critical).toBe(1);
		expect(result.counts.working).toBe(1);
	});

	it("should count blocked attention correctly", () => {
		const execId = createExecutionId();
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.RUNNING,
			attention: ATTENTION_STATE.BLOCKED,
		});
		const map = new Map<ExecutionId, OperationalState>();
		map.set(execId, state);

		const result = buildAttentionProjection(map);
		expect(result.counts.blocked).toBe(1);
	});

	it("should count approval-required correctly", () => {
		const execId = createExecutionId();
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.RUNNING,
			attention: ATTENTION_STATE.APPROVAL_REQUIRED,
		});
		const map = new Map<ExecutionId, OperationalState>();
		map.set(execId, state);

		const result = buildAttentionProjection(map);
		expect(result.counts.approvalRequired).toBe(1);
	});

	it("should count evidence-required correctly", () => {
		const execId = createExecutionId();
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.RUNNING,
			attention: ATTENTION_STATE.EVIDENCE_REQUIRED,
		});
		const map = new Map<ExecutionId, OperationalState>();
		map.set(execId, state);

		const result = buildAttentionProjection(map);
		expect(result.counts.evidenceRequired).toBe(1);
	});

	it("should aggregate multiple states correctly", () => {
		const map = new Map<ExecutionId, OperationalState>();

		map.set(
			createExecutionId(),
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.RUNNING,
				attention: ATTENTION_STATE.CRITICAL,
			}),
		);
		map.set(
			createExecutionId(),
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.FAILED,
			}),
		);
		map.set(
			createExecutionId(),
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.COMPLETED,
			}),
		);

		const result = buildAttentionProjection(map);
		expect(result.counts.critical).toBe(1);
		expect(result.counts.failed).toBe(1);
		expect(result.counts.completed).toBe(1);
		expect(result.counts.working).toBe(1);
	});

	it("should count cancelled and unknown lifecycle states", () => {
		const map = new Map<ExecutionId, OperationalState>();
		map.set(
			createExecutionId(),
			createOperationalState({ lifecycle: LIFECYCLE_STATE.CANCELLED }),
		);
		map.set(
			createExecutionId(),
			createOperationalState({ lifecycle: LIFECYCLE_STATE.UNKNOWN }),
		);

		const result = buildAttentionProjection(map);
		expect(result.counts.cancelled).toBe(1);
		expect(result.counts.unknown).toBe(1);
	});

	it("should count running/verifying/waiting/starting as working", () => {
		const map = new Map<ExecutionId, OperationalState>();
		map.set(
			createExecutionId(),
			createOperationalState({ lifecycle: LIFECYCLE_STATE.RUNNING }),
		);
		map.set(
			createExecutionId(),
			createOperationalState({ lifecycle: LIFECYCLE_STATE.VERIFYING }),
		);
		map.set(
			createExecutionId(),
			createOperationalState({ lifecycle: LIFECYCLE_STATE.WAITING }),
		);
		map.set(
			createExecutionId(),
			createOperationalState({ lifecycle: LIFECYCLE_STATE.STARTING }),
		);

		const result = buildAttentionProjection(map);
		expect(result.counts.working).toBe(4);
	});
});
