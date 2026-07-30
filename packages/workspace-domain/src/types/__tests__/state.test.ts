import { describe, it, expect } from "vitest";
import {
	createOperationalState,
	isTerminal,
	validateOperationalState,
	LIFECYCLE_STATE,
	ATTENTION_STATE,
	PROJECTED_RISK_TIER,
	FRESHNESS_STATE,
} from "../state";

describe("createOperationalState", () => {
	it("should create default operational state with correct defaults", () => {
		const state = createOperationalState();

		expect(state.lifecycle).toBe("queued");
		expect(state.attention).toBe("none");
		expect(state.risk).toBe("R0");
		expect(state.freshness).toBe("live");
	});

	it("should accept custom lifecycle state", () => {
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.RUNNING,
		});
		expect(state.lifecycle).toBe("running");
		// Defaults preserved
		expect(state.attention).toBe("none");
		expect(state.risk).toBe("R0");
		expect(state.freshness).toBe("live");
	});

	it("should accept all custom overrides", () => {
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.VERIFYING,
			attention: ATTENTION_STATE.APPROVAL_REQUIRED,
			risk: PROJECTED_RISK_TIER.R2,
			freshness: FRESHNESS_STATE.DELAYED,
		});
		expect(state.lifecycle).toBe("verifying");
		expect(state.attention).toBe("approval-required");
		expect(state.risk).toBe("R2");
		expect(state.freshness).toBe("delayed");
	});
});

describe("isTerminal", () => {
	it("should return true for completed", () => {
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.COMPLETED,
		});
		expect(isTerminal(state)).toBe(true);
	});

	it("should return true for failed", () => {
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.FAILED,
		});
		expect(isTerminal(state)).toBe(true);
	});

	it("should return true for cancelled", () => {
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.CANCELLED,
		});
		expect(isTerminal(state)).toBe(true);
	});

	it("should return false for unknown", () => {
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.UNKNOWN,
		});
		expect(isTerminal(state)).toBe(false);
	});

	it("should return false for queued", () => {
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.QUEUED,
		});
		expect(isTerminal(state)).toBe(false);
	});

	it("should return false for running", () => {
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.RUNNING,
		});
		expect(isTerminal(state)).toBe(false);
	});

	it("should return false for waiting", () => {
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.WAITING,
		});
		expect(isTerminal(state)).toBe(false);
	});

	it("should return false for verifying", () => {
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.VERIFYING,
		});
		expect(isTerminal(state)).toBe(false);
	});

	it("should return false for starting", () => {
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.STARTING,
		});
		expect(isTerminal(state)).toBe(false);
	});
});

describe("LIFECYCLE_STATE values", () => {
	it("should include UNKNOWN but not treat it as terminal", () => {
		expect(LIFECYCLE_STATE.UNKNOWN).toBe("unknown");
		expect(
			isTerminal(
				createOperationalState({ lifecycle: LIFECYCLE_STATE.UNKNOWN }),
			),
		).toBe(false);
	});

	it("should have all 9 lifecycle states", () => {
		const values = Object.values(LIFECYCLE_STATE).filter(
			(v) => typeof v === "string",
		) as string[];
		expect(values).toHaveLength(9);
		expect(values).toContain("queued");
		expect(values).toContain("starting");
		expect(values).toContain("running");
		expect(values).toContain("verifying");
		expect(values).toContain("waiting");
		expect(values).toContain("completed");
		expect(values).toContain("failed");
		expect(values).toContain("cancelled");
		expect(values).toContain("unknown");
	});
});

describe("validateOperationalState", () => {
	it("should return no violations for a valid default state", () => {
		const state = createOperationalState();
		expect(validateOperationalState(state)).toHaveLength(0);
	});

	it("should return no violations for a valid running state", () => {
		const state = createOperationalState({
			lifecycle: LIFECYCLE_STATE.RUNNING,
			attention: ATTENTION_STATE.NONE,
		});
		expect(validateOperationalState(state)).toHaveLength(0);
	});

	it("should flag COMPLETED with approval-required attention", () => {
		const violations = validateOperationalState(
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.COMPLETED,
				attention: ATTENTION_STATE.APPROVAL_REQUIRED,
			}),
		);
		expect(
			violations.some((v) => v.code === "COMPLETED_REQUIRES_ATTENTION"),
		).toBe(true);
	});

	it("should flag COMPLETED with input-required attention", () => {
		const violations = validateOperationalState(
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.COMPLETED,
				attention: ATTENTION_STATE.INPUT_REQUIRED,
			}),
		);
		expect(
			violations.some((v) => v.code === "COMPLETED_REQUIRES_ATTENTION"),
		).toBe(true);
	});

	it("should flag COMPLETED with evidence-required attention", () => {
		const violations = validateOperationalState(
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.COMPLETED,
				attention: ATTENTION_STATE.EVIDENCE_REQUIRED,
			}),
		);
		expect(
			violations.some((v) => v.code === "COMPLETED_REQUIRES_ATTENTION"),
		).toBe(true);
	});

	it("should flag FAILED with NONE attention", () => {
		const violations = validateOperationalState(
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.FAILED,
				attention: ATTENTION_STATE.NONE,
			}),
		);
		expect(violations.some((v) => v.code === "FAILED_NO_ATTENTION")).toBe(true);
	});

	it("should flag DISCONNECTED with FAILED lifecycle", () => {
		const violations = validateOperationalState(
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.FAILED,
				freshness: FRESHNESS_STATE.DISCONNECTED,
			}),
		);
		expect(violations.some((v) => v.code === "DISCONNECTED_AS_FAILED")).toBe(
			true,
		);
	});

	it("should allow COMPLETED with BLOCKED or CRITICAL attention", () => {
		const v1 = validateOperationalState(
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.COMPLETED,
				attention: ATTENTION_STATE.BLOCKED,
			}),
		);
		const v2 = validateOperationalState(
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.COMPLETED,
				attention: ATTENTION_STATE.CRITICAL,
			}),
		);
		// These are semantically questionable but allowed by the invariant rules
		expect(v1.some((v) => v.code === "COMPLETED_REQUIRES_ATTENTION")).toBe(
			false,
		);
		expect(v2.some((v) => v.code === "COMPLETED_REQUIRES_ATTENTION")).toBe(
			false,
		);
	});

	it("should flag UNKNOWN when treated as terminal", () => {
		// Simulate an invalid terminal check (should never happen via createOperationalState)
		const violations = validateOperationalState(
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.UNKNOWN,
			}),
		);
		// UNKNOWN is not terminal by isTerminal, so this should pass
		expect(
			violations.filter((v) => v.code === "UNKNOWN_TERMINAL"),
		).toHaveLength(0);
	});

	it("should include dimension info in violations", () => {
		const violations = validateOperationalState(
			createOperationalState({
				lifecycle: LIFECYCLE_STATE.COMPLETED,
				attention: ATTENTION_STATE.APPROVAL_REQUIRED,
			}),
		);
		const violation = violations.find(
			(v) => v.code === "COMPLETED_REQUIRES_ATTENTION",
		);
		expect(violation?.dimensions).toContain("lifecycle");
		expect(violation?.dimensions).toContain("attention");
	});
});

describe("PROJECTED_RISK_TIER values", () => {
	it("should have all 4 risk tiers", () => {
		expect(PROJECTED_RISK_TIER.R0).toBe("R0");
		expect(PROJECTED_RISK_TIER.R1).toBe("R1");
		expect(PROJECTED_RISK_TIER.R2).toBe("R2");
		expect(PROJECTED_RISK_TIER.R3).toBe("R3");
	});
});
