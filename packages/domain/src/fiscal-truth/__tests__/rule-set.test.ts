import { describe, expect, it } from "vitest";
import { Money } from "../../value-objects/Money";
import {
	evaluateBancarizationRule,
	PERU_BANCARIZATION_RULE_2026,
} from "../rule-set";

describe("Fiscal Truth legal rule set", () => {
	it("versions bancarization thresholds for 2026 without hardcoding legacy amounts", () => {
		expect(PERU_BANCARIZATION_RULE_2026.version).toBe("DL-1529-2022-v1");
		expect(PERU_BANCARIZATION_RULE_2026.thresholds.PEN.getCents()).toBe(200000);
		expect(PERU_BANCARIZATION_RULE_2026.thresholds.USD.getCents()).toBe(50000);
		expect(PERU_BANCARIZATION_RULE_2026.legalBasis.map((basis) => basis.code)).toContain(
			"DL-1529-2022",
		);
	});

	it("requires auditable payment method at and above the versioned threshold", () => {
		expect(
			evaluateBancarizationRule(Money.fromCents(199999, "PEN"))
				.requiresAuditablePaymentMethod,
		).toBe(false);
		expect(
			evaluateBancarizationRule(Money.fromCents(200000, "PEN"))
				.requiresAuditablePaymentMethod,
		).toBe(true);
		expect(
			evaluateBancarizationRule(Money.fromCents(50000, "USD"))
				.requiresAuditablePaymentMethod,
		).toBe(true);
	});
});
