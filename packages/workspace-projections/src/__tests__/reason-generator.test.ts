import { describe, it, expect } from "vitest";
import {
	createExecutionId,
	createOperationalState,
	ATTENTION_STATE,
	LIFECYCLE_STATE,
} from "@drenyra/workspace-domain";
import type { ExecutionId, OperationalState } from "@drenyra/workspace-domain";
import { generateRollupReasons } from "../rollups/reason-generator";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("generateRollupReasons", () => {
	it("should return empty array for empty states", () => {
		const result = generateRollupReasons(new Map());
		expect(result).toEqual([]);
	});

	it("should generate a CRITICAL reason for critical states", () => {
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
				lifecycle: LIFECYCLE_STATE.RUNNING,
				attention: ATTENTION_STATE.CRITICAL,
			}),
		);

		const result = generateRollupReasons(map);
		expect(result).toHaveLength(1);
		expect(result[0].severity).toBe(ATTENTION_STATE.CRITICAL);
		expect(result[0].affectedCount).toBe(2);
		expect(result[0].message).toContain("critical");
	});

	it("should generate multiple reasons sorted by severity", () => {
		const map = new Map<ExecutionId, OperationalState>();
		map.set(
			createExecutionId(),
			createOperationalState({
				attention: ATTENTION_STATE.BLOCKED,
			}),
		);
		map.set(
			createExecutionId(),
			createOperationalState({
				attention: ATTENTION_STATE.CRITICAL,
			}),
		);
		map.set(
			createExecutionId(),
			createOperationalState({
				attention: ATTENTION_STATE.APPROVAL_REQUIRED,
			}),
		);

		const result = generateRollupReasons(map);
		expect(result.length).toBeGreaterThanOrEqual(1);

		// CRITICAL should come before BLOCKED
		const criticalIdx = result.findIndex(
			(r) => r.severity === ATTENTION_STATE.CRITICAL,
		);
		const blockedIdx = result.findIndex(
			(r) => r.severity === ATTENTION_STATE.BLOCKED,
		);
		if (criticalIdx >= 0 && blockedIdx >= 0) {
			expect(criticalIdx).toBeLessThan(blockedIdx);
		}
	});

	it("should skip states without attention (NONE)", () => {
		const map = new Map<ExecutionId, OperationalState>();
		map.set(
			createExecutionId(),
			createOperationalState({
				attention: ATTENTION_STATE.NONE,
			}),
		);
		map.set(
			createExecutionId(),
			createOperationalState({
				attention: ATTENTION_STATE.BLOCKED,
			}),
		);

		const result = generateRollupReasons(map);
		// Should only have BLOCKED reason, not NONE
		expect(result).toHaveLength(1);
		expect(result[0].severity).toBe(ATTENTION_STATE.BLOCKED);
	});

	it("should count affected states correctly per attention type", () => {
		const map = new Map<ExecutionId, OperationalState>();
		// 3 blocked
		map.set(
			createExecutionId(),
			createOperationalState({ attention: ATTENTION_STATE.BLOCKED }),
		);
		map.set(
			createExecutionId(),
			createOperationalState({ attention: ATTENTION_STATE.BLOCKED }),
		);
		map.set(
			createExecutionId(),
			createOperationalState({ attention: ATTENTION_STATE.BLOCKED }),
		);
		// 2 approval required
		map.set(
			createExecutionId(),
			createOperationalState({ attention: ATTENTION_STATE.APPROVAL_REQUIRED }),
		);
		map.set(
			createExecutionId(),
			createOperationalState({ attention: ATTENTION_STATE.APPROVAL_REQUIRED }),
		);

		const result = generateRollupReasons(map);

		const blockedReason = result.find(
			(r) => r.severity === ATTENTION_STATE.BLOCKED,
		);
		const approvalReason = result.find(
			(r) => r.severity === ATTENTION_STATE.APPROVAL_REQUIRED,
		);

		expect(blockedReason?.affectedCount).toBe(3);
		expect(approvalReason?.affectedCount).toBe(2);
	});

	it("should generate EVIDENCE_REQUIRED reason", () => {
		const map = new Map<ExecutionId, OperationalState>();
		map.set(
			createExecutionId(),
			createOperationalState({ attention: ATTENTION_STATE.EVIDENCE_REQUIRED }),
		);

		const result = generateRollupReasons(map);
		expect(result).toHaveLength(1);
		expect(result[0].severity).toBe(ATTENTION_STATE.EVIDENCE_REQUIRED);
		expect(result[0].message).toContain("evidence");
	});
});
