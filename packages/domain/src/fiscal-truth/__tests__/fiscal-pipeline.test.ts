import { describe, expect, it } from "vitest";
import {
	canAutoApprove,
	FISCAL_ACTION_STATUS,
	FISCAL_ACTION_STATUS_COLORS,
	FISCAL_ACTION_STATUS_LABELS,
	FISCAL_ACTION_STATUS_ORDER,
	FISCAL_RISK_COLORS,
	type FiscalActionStatus,
	type FiscalRiskLevel,
	nextStatus,
	requiresDualSignature,
} from "../fiscal-pipeline";

describe("FiscalPipeline — canAutoApprove", () => {
	it("returns true for LOW risk", () => {
		expect(canAutoApprove("LOW")).toBe(true);
	});

	it("returns false for MEDIUM risk", () => {
		expect(canAutoApprove("MEDIUM")).toBe(false);
	});

	it("returns false for HIGH risk", () => {
		expect(canAutoApprove("HIGH")).toBe(false);
	});

	it("returns false for CRITICAL risk", () => {
		expect(canAutoApprove("CRITICAL")).toBe(false);
	});
});

describe("FiscalPipeline — requiresDualSignature", () => {
	const noSigLevels: FiscalRiskLevel[] = ["LOW", "MEDIUM"];
	const sigLevels: FiscalRiskLevel[] = ["HIGH", "CRITICAL"];

	it.each(noSigLevels)("returns false for %s", (level) => {
		expect(requiresDualSignature(level)).toBe(false);
	});

	it.each(sigLevels)("returns true for %s", (level) => {
		expect(requiresDualSignature(level)).toBe(true);
	});
});

describe("FiscalPipeline — nextStatus", () => {
	it("returns the next status in the pipeline", () => {
		expect(nextStatus("DETECTED")).toBe("ANALYZED");
		expect(nextStatus("ANALYZED")).toBe("PROPOSED");
		expect(nextStatus("PROPOSED")).toBe("VALIDATED");
		expect(nextStatus("VALIDATED")).toBe("APPROVED");
		expect(nextStatus("APPROVED")).toBe("EXECUTED");
		expect(nextStatus("EXECUTED")).toBe("EVIDENCED");
	});

	it("returns null for the last status", () => {
		expect(nextStatus("EVIDENCED")).toBeNull();
	});

	it("returns null for REJECTED (not in order)", () => {
		expect(nextStatus("REJECTED")).toBeNull();
	});

	it("returns null for unknown status", () => {
		expect(nextStatus("INVALID" as FiscalActionStatus)).toBeNull();
	});
});

describe("FiscalPipeline — FISCAL_ACTION_STATUS", () => {
	it("contains all 8 status values", () => {
		const expected = [
			"DETECTED",
			"ANALYZED",
			"PROPOSED",
			"VALIDATED",
			"APPROVED",
			"EXECUTED",
			"EVIDENCED",
			"REJECTED",
		];
		expect(Object.values(FISCAL_ACTION_STATUS)).toEqual(expected);
	});
});

describe("FiscalPipeline — FISCAL_ACTION_STATUS_ORDER", () => {
	it("has exactly 7 steps", () => {
		expect(FISCAL_ACTION_STATUS_ORDER).toHaveLength(7);
	});

	it("follows correct sequence", () => {
		const expected = [
			"DETECTED",
			"ANALYZED",
			"PROPOSED",
			"VALIDATED",
			"APPROVED",
			"EXECUTED",
			"EVIDENCED",
		];
		expect(FISCAL_ACTION_STATUS_ORDER).toEqual(expected);
	});
});

describe("FiscalPipeline — constant mappings", () => {
	const allStatuses: FiscalActionStatus[] = [
		"DETECTED",
		"ANALYZED",
		"PROPOSED",
		"VALIDATED",
		"APPROVED",
		"EXECUTED",
		"EVIDENCED",
		"REJECTED",
	];

	it("FISCAL_ACTION_STATUS_LABELS has entries for all statuses", () => {
		for (const s of allStatuses) {
			expect(FISCAL_ACTION_STATUS_LABELS[s]).toBeDefined();
			expect(typeof FISCAL_ACTION_STATUS_LABELS[s]).toBe("string");
		}
	});

	it("FISCAL_ACTION_STATUS_COLORS has entries for all statuses", () => {
		for (const s of allStatuses) {
			expect(FISCAL_ACTION_STATUS_COLORS[s]).toBeDefined();
			expect(FISCAL_ACTION_STATUS_COLORS[s]).toMatch(/^var\(--color-/);
		}
	});

	it("FISCAL_RISK_COLORS has entries for all risk levels", () => {
		const levels: FiscalRiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
		for (const l of levels) {
			expect(FISCAL_RISK_COLORS[l]).toBeDefined();
			expect(FISCAL_RISK_COLORS[l]).toMatch(/^var\(--color-/);
		}
	});

	it("FISCAL_ACTION_STATUS_COLORS follows REJECTED as danger", () => {
		expect(FISCAL_ACTION_STATUS_COLORS.REJECTED).toBe("var(--color-danger)");
	});
});
