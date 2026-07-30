import { describe, it, expect } from "vitest";
import {
	ATTENTION_STATE,
	PROJECTED_RISK_TIER,
} from "@drenyra/workspace-domain";
import type { MaterialityInput } from "../rollups/types";
import { calculateMateriality } from "../rollups/materiality";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("calculateMateriality", () => {
	it("should return 'critical' when attention is CRITICAL", () => {
		const input: MaterialityInput = {
			severity: ATTENTION_STATE.CRITICAL,
			affectedCompanies: 1,
			riskTier: PROJECTED_RISK_TIER.R0,
			isRegulatoryDeadline: false,
		};
		expect(calculateMateriality(input)).toBe("critical");
	});

	it("should return 'medium' when BLOCKED with <= 5 affected companies", () => {
		const input: MaterialityInput = {
			severity: ATTENTION_STATE.BLOCKED,
			affectedCompanies: 3,
			riskTier: PROJECTED_RISK_TIER.R0,
			isRegulatoryDeadline: false,
		};
		expect(calculateMateriality(input)).toBe("medium");
	});

	it("should return 'high' when BLOCKED with > 5 affected companies", () => {
		const input: MaterialityInput = {
			severity: ATTENTION_STATE.BLOCKED,
			affectedCompanies: 7,
			riskTier: PROJECTED_RISK_TIER.R0,
			isRegulatoryDeadline: false,
		};
		expect(calculateMateriality(input)).toBe("high");
	});

	it("should return 'high' when APPROVAL_REQUIRED with regulatory deadline", () => {
		const input: MaterialityInput = {
			severity: ATTENTION_STATE.APPROVAL_REQUIRED,
			affectedCompanies: 1,
			riskTier: PROJECTED_RISK_TIER.R0,
			isRegulatoryDeadline: true,
		};
		expect(calculateMateriality(input)).toBe("high");
	});

	it("should return 'medium' when APPROVAL_REQUIRED without regulatory deadline", () => {
		const input: MaterialityInput = {
			severity: ATTENTION_STATE.APPROVAL_REQUIRED,
			affectedCompanies: 2,
			riskTier: PROJECTED_RISK_TIER.R0,
			isRegulatoryDeadline: false,
		};
		expect(calculateMateriality(input)).toBe("medium");
	});

	it("should return 'low' when INFORMATIONAL", () => {
		const input: MaterialityInput = {
			severity: ATTENTION_STATE.INFORMATIONAL,
			affectedCompanies: 10,
			riskTier: PROJECTED_RISK_TIER.R0,
			isRegulatoryDeadline: false,
		};
		expect(calculateMateriality(input)).toBe("low");
	});

	it("should bump one level when risk tier is R3", () => {
		const input: MaterialityInput = {
			severity: ATTENTION_STATE.INFORMATIONAL,
			affectedCompanies: 1,
			riskTier: PROJECTED_RISK_TIER.R3,
			isRegulatoryDeadline: false,
		};
		// INFORMATIONAL → "low", bumped by R3 → "medium"
		expect(calculateMateriality(input)).toBe("medium");
	});

	it("should bump one level when estimatedExposure > 100000", () => {
		const input: MaterialityInput = {
			severity: ATTENTION_STATE.NONE,
			affectedCompanies: 1,
			estimatedExposure: 150000,
			riskTier: PROJECTED_RISK_TIER.R0,
			isRegulatoryDeadline: false,
		};
		// NONE → "low", bumped by large exposure → "medium"
		expect(calculateMateriality(input)).toBe("medium");
	});

	it("should enforce minimum 'high' when isRegulatoryDeadline is true", () => {
		const input: MaterialityInput = {
			severity: ATTENTION_STATE.NONE,
			affectedCompanies: 1,
			riskTier: PROJECTED_RISK_TIER.R0,
			isRegulatoryDeadline: true,
		};
		// NONE → "low", but regulatory → minimum "high"
		expect(calculateMateriality(input)).toBe("high");
	});

	it("should combine R3 bump with regulatory deadline correctly", () => {
		const input: MaterialityInput = {
			severity: ATTENTION_STATE.APPROVAL_REQUIRED,
			affectedCompanies: 1,
			riskTier: PROJECTED_RISK_TIER.R3,
			isRegulatoryDeadline: true,
		};
		// APPROVAL_REQUIRED → "medium", regulatory → "high", R3 → bumped to "critical"
		expect(calculateMateriality(input)).toBe("critical");
	});

	it("should return 'medium' for EVIDENCE_REQUIRED", () => {
		const input: MaterialityInput = {
			severity: ATTENTION_STATE.EVIDENCE_REQUIRED,
			affectedCompanies: 1,
			riskTier: PROJECTED_RISK_TIER.R0,
			isRegulatoryDeadline: false,
		};
		expect(calculateMateriality(input)).toBe("medium");
	});

	it("should return 'low' for NONE attention", () => {
		const input: MaterialityInput = {
			severity: ATTENTION_STATE.NONE,
			affectedCompanies: 1,
			riskTier: PROJECTED_RISK_TIER.R0,
			isRegulatoryDeadline: false,
		};
		expect(calculateMateriality(input)).toBe("low");
	});
});
